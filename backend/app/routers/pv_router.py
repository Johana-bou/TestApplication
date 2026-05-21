from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from datetime import date
from typing import List, Optional
from app.database import get_db
from app.models import (
    ProcesVerbal, Utilisateur, Poste,
    SituationVirement, SituationCheque
)
from app.security.auth import get_current_user
from app.utils.pdf_generator import generate_pv_pdf
from app.schemas.pv import VirementsBulkCreate, ChequesBulkCreate

router = APIRouter(tags=["Procès-Verbal"])


# ─── Utilitaires ─────────────────────────────────────────────────────────────

def verifier_acces_poste(utilisateur: Utilisateur, poste_id: int):
    if utilisateur.role == "ADMIN":
        return True
    if utilisateur.poste_id != poste_id:
        raise HTTPException(
            status_code=403,
            detail=f"Accès non autorisé au poste ID {poste_id}"
        )
    return True


def verifier_acces_pv(utilisateur: Utilisateur, pv: ProcesVerbal):
    if utilisateur.role == "ADMIN":
        return True
    if utilisateur.poste_id != pv.id_poste:
        raise HTTPException(status_code=403, detail="Accès non autorisé à ce procès-verbal")
    return True

def generer_num_pv(db: Session, poste: Poste, date_pv: date, id_pv: Optional[int] = None) -> str:
    nb_existants = db.query(ProcesVerbal).filter(
        ProcesVerbal.id_poste == poste.id_poste,
        ProcesVerbal.date_pv >= date(date_pv.year, date_pv.month, 1),
        ProcesVerbal.date_pv <= date_pv
    )
    if id_pv is not None:
        nb_existants = nb_existants.filter(ProcesVerbal.id_pv != id_pv)
    count = nb_existants.count()
    sequence = count + 1
    code_poste = (poste.code_poste or "PV")[:4].upper()
    return f"PV-{code_poste}-{date_pv.year}-{str(date_pv.month).zfill(2)}-{str(sequence).zfill(3)}"

# ─── Routes ──────────────────────────────────────────────────────────────────

# ========== 1. CRÉER UN PV ==========
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_pv(
    data        : dict,
    db          : Session     = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    from app.utils.pdf_generator import get_dernier_jour_mois, get_mois_precedent

    # 1. Récupération du poste_id
    poste_id = data.get("poste_id")
    if not poste_id:
        raise HTTPException(status_code=400, detail="poste_id est requis")

    # 2. Vérification des droits
    if current_user.role != "ADMIN" and current_user.poste_id != poste_id:
        raise HTTPException(status_code=403, detail="Accès non autorisé à ce poste")

    # 3. Récupération du poste
    poste = db.query(Poste).filter(Poste.id_poste == poste_id).first()
    if not poste:
        raise HTTPException(status_code=404, detail="Poste non trouvé")

    # 4. Date du PV
    date_pv_str = data.get("date_pv")
    if not date_pv_str:
        raise HTTPException(status_code=400, detail="date_pv est obligatoire")
    date_pv = date.fromisoformat(date_pv_str)

    # 5. Calcul des dates de période
    annee, mois = date_pv.year, date_pv.month
    dernier_jour = get_dernier_jour_mois(annee, mois)
    annee_prec, mois_prec = get_mois_precedent(annee, mois)
    dernier_jour_prec = get_dernier_jour_mois(annee_prec, mois_prec)

    date_dernier_controle = date(annee_prec, mois_prec, dernier_jour_prec)
    date_debut_periode    = date(annee, mois, 1)
    date_fin_periode      = date(annee, mois, dernier_jour)

    # 6. Calculs financiers
    solde_dc  = data.get("solde_dernier_controle", 0) or 0
    mouv_deb  = data.get("mouvements_debiteurs",   0) or 0
    mouv_cred = data.get("mouvements_crediteurs",  0) or 0

    solde_theorique = solde_dc + mouv_deb - mouv_cred
    difference      = solde_theorique - solde_dc

    # 7. Génération automatique du numéro de PV
    num_pv = generer_num_pv(db, poste, date_pv)

    # 8. Création du PV
    pv = ProcesVerbal(
        id_poste               = poste_id,
        id_user                = current_user.id_user,
        num_pv                 = num_pv,
        date_pv                = date_pv,
        date_dernier_controle  = date_dernier_controle,
        date_debut_periode     = date_debut_periode,
        date_fin_periode       = date_fin_periode,
        solde_dernier_controle = solde_dc,
        mouvements_debiteurs   = mouv_deb,
        mouvements_crediteurs  = mouv_cred,
        solde_theorique        = solde_theorique,
        difference             = difference,
        observation            = data.get("observation")
    )
    db.add(pv)
    db.flush()

    # 9. Virements
    for v in data.get("virements", []):
        db.add(SituationVirement(
            id_pv         = pv.id_pv,
            date_virement = date.fromisoformat(v["date_virement"]) if v.get("date_virement") else None,
            num_virement  = v.get("num_virement"),
            montant       = v.get("montant", 0),
            observation   = v.get("observation")
        ))

    # 10. Chèques
    for c in data.get("cheques", []):
        db.add(SituationCheque(
            id_pv       = pv.id_pv,
            date_cheque = date.fromisoformat(c["date_cheque"]) if c.get("date_cheque") else None,
            num_cheque  = c.get("num_cheque"),
            montant     = c.get("montant", 0),
            num_dr      = c.get("num_dr"),
            observation = c.get("observation")
        ))

    db.commit()

    return {
        "message": "PV créé avec succès",
        "id_pv": pv.id_pv,
        "num_pv": pv.num_pv
    }

# ========== 2. LISTER TOUS LES PV ==========
@router.get("/")
def get_all_pv(
    skip        : int       = 0,
    limit       : int       = 100,
    db          : Session   = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    query = db.query(ProcesVerbal)
    if current_user.role != "ADMIN":
        query = query.filter(ProcesVerbal.id_poste == current_user.poste_id)

    pvs = query.order_by(ProcesVerbal.date_pv.desc()).offset(skip).limit(limit).all()

    return [
        {
            "id_pv"          : p.id_pv,
            "num_pv"         : p.num_pv,
            "date_pv"        : p.date_pv,
            "id_poste"       : p.id_poste,
            "solde_theorique": float(p.solde_theorique or 0),
            "difference"     : float(p.difference      or 0),
            "date_creation"  : p.date_creation
        }
        for p in pvs
    ]


# ========== 3. PV D'UN POSTE ==========
@router.get("/poste/{poste_id}")
def get_pv_by_poste(
    poste_id    : int,
    skip        : int     = 0,
    limit       : int     = 100,
    db          : Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    verifier_acces_poste(current_user, poste_id)
    pvs = db.query(ProcesVerbal).filter(
        ProcesVerbal.id_poste == poste_id
    ).order_by(ProcesVerbal.date_pv.desc()).offset(skip).limit(limit).all()

    return [
        {
            "id_pv"          : p.id_pv,
            "num_pv"         : p.num_pv,
            "date_pv"        : p.date_pv,
            "solde_theorique": float(p.solde_theorique or 0),
            "difference"     : float(p.difference      or 0)
        }
        for p in pvs
    ]


# ========== 4. AJOUTER UN VIREMENT ==========
@router.post("/{pv_id}/virements", status_code=201)
def add_virement(
    pv_id       : int,
    data        : dict,
    db          : Session     = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    pv = db.query(ProcesVerbal).filter(ProcesVerbal.id_pv == pv_id).first()
    if not pv:
        raise HTTPException(404, "PV non trouvé")
    verifier_acces_pv(current_user, pv)

    virement = SituationVirement(
        id_pv         = pv.id_pv,
        date_virement = date.fromisoformat(data["date_virement"]),
        num_virement  = data["num_virement"],
        montant       = data["montant"],
        observation   = data.get("observation")
    )
    db.add(virement)
    db.commit()
    db.refresh(virement)
    return {"id_virement": virement.id_virement, "message": "Virement ajouté"}


# ========== 5. AJOUTER PLUSIEURS VIREMENTS ==========
@router.post("/{pv_id}/virements/bulk", status_code=201)
def add_multiple_virements(
    pv_id       : int,
    data        : VirementsBulkCreate,
    db          : Session     = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    pv = db.query(ProcesVerbal).filter(ProcesVerbal.id_pv == pv_id).first()
    if not pv:
        raise HTTPException(404, "PV non trouvé")
    verifier_acces_pv(current_user, pv)

    nouveaux = []
    for v in data.virements:
        virement = SituationVirement(
            id_pv         = pv.id_pv,
            date_virement = v.date_virement,
            num_virement  = v.num_virement,
            montant       = v.montant,
            observation   = v.observation
        )
        db.add(virement)
        nouveaux.append(virement)
    db.commit()
    return {"message": f"{len(nouveaux)} virement(s) ajouté(s)"}


# ========== 6. DÉTAIL D'UN PV ==========
@router.get("/{pv_id}")
def get_pv_by_id(
    pv_id       : int,
    db          : Session     = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    pv = db.query(ProcesVerbal).filter(ProcesVerbal.id_pv == pv_id).first()
    if not pv:
        raise HTTPException(status_code=404, detail="PV non trouvé")

    if current_user.role != "ADMIN" and current_user.poste_id != pv.id_poste:
        raise HTTPException(status_code=403, detail="Accès non autorisé à ce procès-verbal")

    virements = db.query(SituationVirement).filter(SituationVirement.id_pv == pv_id).all()
    cheques   = db.query(SituationCheque).filter(SituationCheque.id_pv   == pv_id).all()

    return {
        "id_pv"                : pv.id_pv,
        "num_pv"               : pv.num_pv,
        "date_pv"              : pv.date_pv,
        "date_dernier_controle": pv.date_dernier_controle,
        "date_debut_periode"   : pv.date_debut_periode,
        "date_fin_periode"     : pv.date_fin_periode,
        "id_poste"             : pv.id_poste,
        "id_user"              : pv.id_user,
        "solde_dernier_controle": float(pv.solde_dernier_controle or 0),
        "mouvements_debiteurs"  : float(pv.mouvements_debiteurs   or 0),
        "mouvements_crediteurs" : float(pv.mouvements_crediteurs  or 0),
        "solde_theorique"       : float(pv.solde_theorique        or 0),
        "difference"            : float(pv.difference             or 0),
        "observation"           : pv.observation,
        "virements": [
            {
                "id_virement"  : v.id_virement,
                "date_virement": v.date_virement,
                "num_virement" : v.num_virement,
                "montant"      : float(v.montant or 0),
                "observation"  : v.observation
            }
            for v in virements
        ],
        "cheques": [
            {
                "id_cheque"  : c.id_cheque,
                "date_cheque": c.date_cheque,
                "num_cheque" : c.num_cheque,
                "montant"    : float(c.montant or 0),
                "num_dr"     : c.num_dr,
                "observation": c.observation
            }
            for c in cheques
        ]
    }


# ========== 7. MODIFIER UN PV ==========
@router.put("/{pv_id}")
def update_pv(
    pv_id       : int,
    data        : dict,
    db          : Session     = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    pv = db.query(ProcesVerbal).filter(ProcesVerbal.id_pv == pv_id).first()
    if not pv:
        raise HTTPException(status_code=404, detail="PV non trouvé")

    if current_user.role != "ADMIN" and current_user.poste_id != pv.id_poste:
        raise HTTPException(status_code=403, detail="Accès non autorisé")

    if "observation" in data:
        pv.observation = data["observation"]

    db.commit()
    return {"id_pv": pv.id_pv, "num_pv": pv.num_pv, "message": "PV mis à jour"}


# ========== 8. SUPPRIMER UN PV ==========
@router.delete("/{pv_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pv(
    pv_id       : int,
    db          : Session     = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    pv = db.query(ProcesVerbal).filter(ProcesVerbal.id_pv == pv_id).first()
    if not pv:
        raise HTTPException(status_code=404, detail="PV non trouvé")

    # ADMIN : tout ; RECEVEUR : seulement ceux de son poste
    if current_user.role != "ADMIN" and current_user.poste_id != pv.id_poste:
        raise HTTPException(status_code=403, detail="Droits insuffisants")

    db.delete(pv)   # La cascade fonctionne maintenant
    db.commit()

# ========== 9. GÉNÉRER LE PDF ==========
@router.get("/{pv_id}/pdf")
def generate_pdf(
    pv_id       : int,
    db          : Session     = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    pv = db.query(ProcesVerbal).filter(ProcesVerbal.id_pv == pv_id).first()
    if not pv:
        raise HTTPException(status_code=404, detail="PV non trouvé")

    if current_user.role != "ADMIN" and current_user.poste_id != pv.id_poste:
        raise HTTPException(status_code=403, detail="Accès non autorisé")

    virements = db.query(SituationVirement).filter(SituationVirement.id_pv == pv_id).all()
    cheques   = db.query(SituationCheque).filter(SituationCheque.id_pv   == pv_id).all()
    poste     = db.query(Poste).filter(Poste.id_poste == pv.id_poste).first()

    if not poste:
        raise HTTPException(status_code=404, detail="Poste non trouvé")

    try:
        pdf_bytes = generate_pv_pdf(pv, virements, cheques, poste, current_user)
        return Response(
            content    = pdf_bytes,
            media_type = "application/pdf",
            headers    = {"Content-Disposition": f'attachment; filename="PV_{pv.num_pv}.pdf"'}
        )
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erreur génération PDF : {str(e)}")