# app/routers/etat_nominatif_router.py
from fastapi import APIRouter, Depends, HTTPException, status, Response, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, extract
from datetime import date
from typing import List, Optional
from app.database import get_db
from app.models import (
    EtatNominatif, LigneNominatif, Usager, Compte,
    Utilisateur, Poste
)
from app.security.auth import get_current_user
from app.schemas.etat_nominatif import (
    EtatNominatifCreate, EtatNominatifUpdate,
    EtatNominatifResponse, EtatNominatifDetailResponse,
    LigneNominatifCreate, UsagerDisponibleResponse,
    TypeEtat
)
from app.utils.pdf_etat_nominatif import generate_etat_nominatif_pdf


router = APIRouter(tags=["États Nominatifs"])


# ═══════════════════════════════════════════════════════════════════════════
# ROUTES STATIQUES — doivent être AVANT les routes dynamiques /{etat_id}
# ═══════════════════════════════════════════════════════════════════════════

# ========== 0. TYPES DISPONIBLES ==========
@router.get("/types/disponibles")
def get_types_disponibles():
    """Retourne les types disponibles (RAR, AMENDE) pour le frontend."""
    return [
        {
            "valeur"      : "RAR",
            "libelle"     : "Restes à Recouvrer (RAR)",
            "description" : "État nominatif des restes à recouvrer sur recettes fiscales douanes"
        },
        {
            "valeur"      : "AMENDE",
            "libelle"     : "Amendes Douanières",
            "description" : "État nominatif des restes à recouvrer sur recettes fiscales amendes douanières"
        }
    ]


# ========== 0bis. COMPTE AMENDE D'UN POSTE ==========
@router.get("/compte-amende/{poste_id}")
def get_compte_amende(
    poste_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user)
):
    """Retourne le compte AMANDE configuré pour un poste."""
    compte = db.query(Compte).filter(
        Compte.id_poste   == poste_id,
        Compte.nom_compte.ilike("%AMANDE%")
    ).first()

    if not compte:
        raise HTTPException(
            status_code=404,
            detail="Aucun compte AMANDE configuré pour ce poste. Créez-en un via /api/comptes/"
        )
    return {
        "id_compte" : compte.id_compte,
        "num_compte": compte.num_compte,
        "nom_compte": compte.nom_compte
    }


# ========== 1. LISTER TOUS LES ÉTATS ==========
@router.get("/", response_model=List[EtatNominatifResponse])
def get_all_etats_nominatifs(
    skip       : int            = Query(0, ge=0),
    limit : Optional[int] = Query(None, ge=1),
    date_debut : Optional[date] = None,
    date_fin   : Optional[date] = None,
    db         : Session        = Depends(get_db),
    current_user: Utilisateur   = Depends(get_current_user)
):
    """Liste tous les états nominatifs filtrés par période."""
    
    query = db.query(EtatNominatif).options(joinedload(EtatNominatif.lignes))

    if current_user.role != "ADMIN":
        query = query.filter(EtatNominatif.id_user == current_user.id_user)
    if date_debut:
        query = query.filter(EtatNominatif.date_etat >= date_debut)
    if date_fin:
        query = query.filter(EtatNominatif.date_etat <= date_fin)

    etats = query.order_by(desc(EtatNominatif.date_etat)).offset(skip)
    if limit is not None:
        etats = etats.limit(limit)
    etats = etats.all()

    for e in etats:
     print(f"Etat {e.id_etat} - nb lignes: {len(e.lignes)} - total_physique: {sum(l.montant_rar_physique or 0 for l in e.lignes)}")

    return [
        {
            "id_etat"       : e.id_etat,
            "id_user"       : e.id_user,
            "date_etat"     : e.date_etat,
            "observation"   : e.observation,
            "type"          : e.type,
            "id_compte"     : e.id_compte,
            "date_creation" : e.date_creation,
            "nombre_lignes" : len(e.lignes),
            "total_physique": sum(l.montant_rar_physique or 0 for l in e.lignes),
            "total_balance" : sum(l.montant_rar_balance  or 0 for l in e.lignes),
            "total_ecart"   : sum(
                (l.montant_rar_physique or 0) - (l.montant_rar_balance or 0)
                for l in e.lignes
            ),
            "createur": e.utilisateur.nom_complet if e.utilisateur else None
        }
        for e in etats
    ]


# ========== 2. CRÉER UN ÉTAT ==========
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_etat_nominatif(
    data        : EtatNominatifCreate,
    db          : Session     = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Crée un nouvel état nominatif (RAR ou AMENDE)."""
    type_str = data.type.value if hasattr(data.type, "value") else str(data.type)

    # Résoudre le compte AMENDE automatiquement si non fourni
    id_compte = data.id_compte
    if type_str == "AMENDE" and id_compte is None:
        poste = db.query(Poste).filter(Poste.id_poste == current_user.poste_id).first()
        if not poste:
            raise HTTPException(status_code=404, detail="Poste non trouvé")

        compte = db.query(Compte).filter(
            Compte.id_poste   == poste.id_poste,
            Compte.nom_compte.ilike("%AMANDE%")
        ).first()
        if not compte:
            raise HTTPException(
                status_code=400,
                detail="Aucun compte AMANDE configuré pour ce poste. Créez-en un via /api/comptes/"
            )
        id_compte = compte.id_compte

    etat = EtatNominatif(
        id_user     = current_user.id_user,
        date_etat   = data.date_etat or date.today(),
        observation = data.observation,
        type        = type_str,
        id_compte   = id_compte
    )
    db.add(etat)
    db.flush()

    for ligne_data in data.lignes:
        usager = db.query(Usager).filter(Usager.id_usager == ligne_data.id_usager).first()
        if not usager:
            raise HTTPException(status_code=404, detail=f"Usager {ligne_data.id_usager} non trouvé")

        db.add(LigneNominatif(
            id_etat              = etat.id_etat,
            id_usager            = ligne_data.id_usager,
            libelle              = ligne_data.libelle,
            montant_rar_physique = ligne_data.montant_rar_physique,
            montant_rar_balance  = ligne_data.montant_rar_balance
        ))

    db.commit()
    return {
        "id_etat": etat.id_etat,
        "type"   : etat.type,
        "message": f"État nominatif {etat.type} créé avec succès"
    }


# ========== 3. USAGERS DISPONIBLES ==========
@router.get("/usagers/disponibles")
def get_usagers_disponibles(
    etat_id : Optional[int] = None,
    search  : Optional[str] = None,
    db      : Session       = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Récupère les usagers disponibles pour un état (avec filtre et exclusion)."""
    query = db.query(Usager).join(Compte)

    if current_user.role != "ADMIN" and current_user.poste_id:
        query = query.filter(Compte.id_poste == current_user.poste_id)

    if search:
        query = query.filter(
            (Usager.nom_usager.contains(search))    |
            (Usager.raison_sociale.contains(search)) |
            (Compte.num_compte.contains(search))
        )

    if etat_id:
        existing_ids = db.query(LigneNominatif.id_usager).filter(
            LigneNominatif.id_etat == etat_id
        ).subquery()
        query = query.filter(Usager.id_usager.notin_(existing_ids))

    usagers = query.limit(100).all()
    return [
        {
            "id_usager"     : u.id_usager,
            "nom_usager"    : u.nom_usager,       # ← nom en priorité
            "raison_sociale": u.raison_sociale,
            "compte_numero" : u.compte.num_compte if u.compte else "",
            "compte_nom"    : u.compte.nom_compte if u.compte else "",
            "telephone"     : u.telephone
        }
        for u in usagers
    ]


# ========== 4. DÉTAIL D'UN USAGER ==========
@router.get("/usagers/{usager_id}")
def get_usager_detail(
    usager_id   : int,
    db          : Session     = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Récupère le détail d'un usager avec son compte."""
    usager = db.query(Usager).filter(Usager.id_usager == usager_id).first()
    if not usager:
        raise HTTPException(status_code=404, detail="Usager non trouvé")

    compte = db.query(Compte).filter(Compte.id_compte == usager.id_compte).first()
    return {
        "id_usager"     : usager.id_usager,
        "nom_usager"    : usager.nom_usager,
        "raison_sociale": usager.raison_sociale,
        "telephone"     : usager.telephone,
        "compte": {
            "id_compte" : compte.id_compte   if compte else None,
            "num_compte": compte.num_compte  if compte else "",
            "nom_compte": compte.nom_compte  if compte else ""
        } if compte else None
    }


# ========== 5. TÉLÉCHARGER PDF PAR TYPE ET PÉRIODE ==========
@router.get("/telecharger/pdf")
def telecharger_pdf_par_type_et_mois(
    type        : str = Query(..., regex="^(RAR|AMENDE)$"),
    mois        : int = Query(..., ge=1, le=12),
    annee       : int = Query(..., ge=2000, le=2100),
    orientation : str = Query("portrait", regex="^(portrait|paysage)$"),
    db          : Session     = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Télécharge le PDF d'un état nominatif pour un type et un mois précis."""
    query = db.query(EtatNominatif).filter(
        EtatNominatif.type == type,
        extract("month", EtatNominatif.date_etat) == mois,
        extract("year",  EtatNominatif.date_etat) == annee,
    )

    if current_user.role != "ADMIN":
        query = query.filter(EtatNominatif.id_user == current_user.id_user)

    etat = query.first()
    if not etat:
        mois_fr = ["", "Janvier","Février","Mars","Avril","Mai","Juin",
                   "Juillet","Août","Septembre","Octobre","Novembre","Décembre"]
        raise HTTPException(
            status_code=404,
            detail=f"Aucun état {type} enregistré pour {mois_fr[mois]} {annee}"
        )
    return _generer_pdf_etat(etat, db, current_user, orientation)


# ═══════════════════════════════════════════════════════════════════════════
# ROUTES SUR LES LIGNES — avant /{etat_id} pour éviter les conflits
# ═══════════════════════════════════════════════════════════════════════════

# ========== 6. MODIFIER UNE LIGNE ==========
@router.put("/lignes/{ligne_id}")
def update_ligne_nominatif(
    ligne_id    : int,
    data        : dict,
    db          : Session     = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Modifie le libellé et les montants d'une ligne nominative."""
    ligne = db.query(LigneNominatif).filter(LigneNominatif.id_ligne == ligne_id).first()
    if not ligne:
        raise HTTPException(status_code=404, detail="Ligne non trouvée")

    etat = db.query(EtatNominatif).filter(EtatNominatif.id_etat == ligne.id_etat).first()
    if current_user.role != "ADMIN" and etat.id_user != current_user.id_user:
        raise HTTPException(status_code=403, detail="Accès refusé")

    if "libelle" in data:
        ligne.libelle = data["libelle"]
    if "montant_rar_physique" in data:
        ligne.montant_rar_physique = data["montant_rar_physique"]
    if "montant_rar_balance" in data:
        ligne.montant_rar_balance = data["montant_rar_balance"]

    db.commit()
    db.refresh(ligne)
    return {"message": "Ligne modifiée avec succès", "id_ligne": ligne.id_ligne}


# ========== 7. SUPPRIMER UNE LIGNE ==========
@router.delete("/lignes/{ligne_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ligne_from_etat(
    ligne_id    : int,
    db          : Session     = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Supprime une ligne d'un état."""
    ligne = db.query(LigneNominatif).filter(LigneNominatif.id_ligne == ligne_id).first()
    if not ligne:
        raise HTTPException(status_code=404, detail="Ligne non trouvée")

    etat = db.query(EtatNominatif).filter(EtatNominatif.id_etat == ligne.id_etat).first()
    if current_user.role != "ADMIN" and etat.id_user != current_user.id_user:
        raise HTTPException(status_code=403, detail="Accès refusé")

    db.delete(ligne)
    db.commit()


# ═══════════════════════════════════════════════════════════════════════════
# ROUTES DYNAMIQUES /{etat_id} — toujours en dernier
# ═══════════════════════════════════════════════════════════════════════════

# ========== 8. DÉTAIL D'UN ÉTAT ==========
@router.get("/{etat_id}")
def get_etat_nominatif_by_id(
    etat_id     : int,
    db          : Session     = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Détail complet d'un état nominatif avec toutes ses lignes et nom des usagers."""
    etat = db.query(EtatNominatif).filter(EtatNominatif.id_etat == etat_id).first()
    if not etat:
        raise HTTPException(status_code=404, detail="État non trouvé")

    if current_user.role != "ADMIN" and etat.id_user != current_user.id_user:
        raise HTTPException(status_code=403, detail="Vous n'avez pas accès à cet état")

    lignes         = db.query(LigneNominatif).filter(LigneNominatif.id_etat == etat_id).all()
    total_physique = 0
    total_balance  = 0
    lignes_detail  = []

    for ligne in lignes:
        usager = db.query(Usager).filter(Usager.id_usager == ligne.id_usager).first()
        # ← nom_usager inclus dans la réponse
        nom_usager = usager.nom_usager if usager else f"Usager #{ligne.id_usager}"

        total_physique += ligne.montant_rar_physique or 0
        total_balance  += ligne.montant_rar_balance  or 0

        lignes_detail.append({
            "id_ligne"            : ligne.id_ligne,
            "id_usager"           : ligne.id_usager,
            "nom_usager"          : nom_usager,       # ← ajouté
            "libelle"             : ligne.libelle,
            "montant_rar_physique": ligne.montant_rar_physique or 0,
            "montant_rar_balance" : ligne.montant_rar_balance  or 0,
            "ecart"               : ligne.ecart
        })

    return {
        "id_etat"      : etat.id_etat,
        "id_user"      : etat.id_user,
        "date_etat"    : etat.date_etat,
        "observation"  : etat.observation,
        "type"         : etat.type,
        "id_compte"    : etat.id_compte,
        "date_creation": etat.date_creation,
        "totaux": {
            "montant_rar_physique": total_physique,
            "montant_rar_balance" : total_balance,
            "ecart"               : total_physique - total_balance
        },
        "lignes": lignes_detail
    }


# ========== 9. MODIFIER UN ÉTAT ==========
@router.put("/{etat_id}")
def update_etat_nominatif(
    etat_id     : int,
    data        : EtatNominatifUpdate,
    db          : Session     = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Modifie un état nominatif (observation, date)."""
    etat = db.query(EtatNominatif).filter(EtatNominatif.id_etat == etat_id).first()
    if not etat:
        raise HTTPException(status_code=404, detail="État non trouvé")

    if current_user.role != "ADMIN" and etat.id_user != current_user.id_user:
        raise HTTPException(status_code=403, detail="Vous ne pouvez modifier que vos propres états")

    if data.date_etat is not None:
        etat.date_etat = data.date_etat
    if data.observation is not None:
        etat.observation = data.observation

    db.commit()
    db.refresh(etat)
    return {
        "id_etat"    : etat.id_etat,
        "message"    : "État mis à jour avec succès",
        "date_etat"  : etat.date_etat,
        "observation": etat.observation
    }


# ========== 10. SUPPRIMER UN ÉTAT COMPLET ==========
@router.delete("/{etat_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_etat_nominatif(
    etat_id     : int,
    db          : Session     = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Supprime un état complet (les lignes sont supprimées en cascade)."""
    if current_user.role not in ["ADMIN", "RECEVEUR"]:
        raise HTTPException(status_code=403, detail="Droits insuffisants")

    etat = db.query(EtatNominatif).filter(EtatNominatif.id_etat == etat_id).first()
    if not etat:
        raise HTTPException(status_code=404, detail="État non trouvé")

    if current_user.role != "ADMIN" and etat.id_user != current_user.id_user:
        raise HTTPException(status_code=403, detail="Vous ne pouvez supprimer que vos propres états")

    db.delete(etat)
    db.commit()


# ========== 11. AJOUTER UNE LIGNE À UN ÉTAT ==========
@router.post("/{etat_id}/lignes", status_code=status.HTTP_201_CREATED)
def add_ligne_to_etat(
    etat_id     : int,
    ligne_data  : LigneNominatifCreate,
    db          : Session     = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Ajoute une ligne à un état existant."""
    etat = db.query(EtatNominatif).filter(EtatNominatif.id_etat == etat_id).first()
    if not etat:
        raise HTTPException(status_code=404, detail="État non trouvé")

    if current_user.role != "ADMIN" and etat.id_user != current_user.id_user:
        raise HTTPException(status_code=403, detail="Accès refusé")

    usager = db.query(Usager).filter(Usager.id_usager == ligne_data.id_usager).first()
    if not usager:
        raise HTTPException(status_code=404, detail=f"Usager {ligne_data.id_usager} non trouvé")

    existing = db.query(LigneNominatif).filter(
        LigneNominatif.id_etat   == etat_id,
        LigneNominatif.id_usager == ligne_data.id_usager
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Cet usager est déjà dans l'état")

    ligne = LigneNominatif(
        id_etat              = etat_id,
        id_usager            = ligne_data.id_usager,
        libelle              = ligne_data.libelle,
        montant_rar_physique = ligne_data.montant_rar_physique or 0,
        montant_rar_balance  = ligne_data.montant_rar_balance  or 0
    )
    db.add(ligne)
    db.commit()
    db.refresh(ligne)
    return {
        "id_ligne": ligne.id_ligne,
        "message" : "Ligne ajoutée avec succès",
        "usager"  : usager.nom_usager
    }


# ========== 12. EXPORTER EN PDF ==========
@router.get("/{etat_id}/pdf")
def export_etat_nominatif_pdf(
    etat_id     : int,
    orientation : str = Query("portrait", regex="^(portrait|paysage)$"),
    db          : Session     = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Exporte l'état nominatif en PDF (portrait ou paysage)."""
    etat = db.query(EtatNominatif).filter(EtatNominatif.id_etat == etat_id).first()
    if not etat:
        raise HTTPException(status_code=404, detail="État non trouvé")

    if current_user.role != "ADMIN" and etat.id_user != current_user.id_user:
        raise HTTPException(status_code=403, detail="Accès refusé")

    lignes        = db.query(LigneNominatif).filter(LigneNominatif.id_etat == etat_id).all()
    lignes_detail = []

    for ligne in lignes:
        usager = db.query(Usager).filter(Usager.id_usager == ligne.id_usager).first()
        compte = db.query(Compte).filter(
            Compte.id_compte == usager.id_compte
        ).first() if usager else None
        lignes_detail.append({"ligne": ligne, "usager": usager, "compte": compte})

    poste = db.query(Poste).filter(
        Poste.id_poste == current_user.poste_id
    ).first() if current_user.poste_id else db.query(Poste).first()

    compte_amende = None
    if etat.id_compte:
        compte_amende = db.query(Compte).filter(Compte.id_compte == etat.id_compte).first()

    pdf_bytes = generate_etat_nominatif_pdf(
        etat          = etat,
        lignes_detail = lignes_detail,
        utilisateur   = current_user,
        poste         = poste,
        orientation   = orientation,
        compte        = compte_amende,
    )

    type_str = etat.type if isinstance(etat.type, str) else etat.type.value
    return Response(
        content    = pdf_bytes,
        media_type = "application/pdf",
        headers    = {
            "Content-Disposition":
                f'attachment; filename="EtatNominatif_{type_str}_{etat.date_etat}.pdf"'
        }
    )