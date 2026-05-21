# app/routers/etat_rapprochement_router.py
from fastapi import APIRouter, Depends, HTTPException, status, Response, Query
from sqlalchemy.orm import Session
from sqlalchemy import extract
from datetime import date
from typing import Optional
from app.database import get_db
from app.models import EtatRapprochement, Compte, Utilisateur, Poste
from app.security.auth import get_current_user
from app.utils.pdf_etat_rapprochement import generate_etat_rapprochement_pdf as generate_pdf

router = APIRouter(tags=["États Rapprochement"])


# ═══════════════════════════════════════════════════════════════════════════
# UTILITAIRES
# ═══════════════════════════════════════════════════════════════════════════

def verifier_acces_compte(compte: Compte, current_user: Utilisateur):
    """Lève 403 si l'utilisateur n'est pas ADMIN et que le compte n'est pas de son poste."""
    if current_user.role != "ADMIN" and compte.id_poste != current_user.poste_id:
        raise HTTPException(status_code=403, detail="Accès non autorisé à ce compte")


def verifier_acces_rapprochement(
    rap         : EtatRapprochement,
    db          : Session,
    current_user: Utilisateur
):
    """Vérifie l'accès au rapprochement via son compte associé."""
    compte = db.query(Compte).filter(Compte.id_compte == rap.id_compte).first()
    if not compte:
        raise HTTPException(status_code=404, detail="Compte associé introuvable")
    verifier_acces_compte(compte, current_user)


def calculer_montants(solde_balance: float, op_acct: float, op_poste: float):
    """Calcule le solde théorique et l'écart."""
    solde_theorique = solde_balance + op_acct - op_poste
    ecart           = solde_theorique - solde_balance
    return solde_theorique, ecart


# ═══════════════════════════════════════════════════════════════════════════
# ROUTES STATIQUES — avant les routes dynamiques /{id}
# ═══════════════════════════════════════════════════════════════════════════

# ========== 1. LISTER TOUS LES RAPPROCHEMENTS ==========
@router.get("/")
def get_all_rapprochements(
    skip  : int           = 0,
    limit : Optional[int] = None,
    annee       : Optional[int] = None,
    mois        : Optional[int] = None,
    id_compte   : Optional[int] = None,
    db          : Session       = Depends(get_db),
    current_user: Utilisateur   = Depends(get_current_user)
):
    """
    Liste des rapprochements avec filtres optionnels mois / année / compte.
    - ADMIN   : voit tous les rapprochements
    - RECEVEUR : voit uniquement les comptes de son poste
    """
    query = db.query(EtatRapprochement)

    if current_user.role != "ADMIN":
        subq = db.query(Compte.id_compte).filter(
            Compte.id_poste == current_user.poste_id
        ).subquery()
        query = query.filter(EtatRapprochement.id_compte.in_(subq))

    if id_compte:
        query = query.filter(EtatRapprochement.id_compte == id_compte)
    if annee:
        query = query.filter(
            extract("year", EtatRapprochement.date_rapprochement) == annee
        )
    if mois:
        query = query.filter(
            extract("month", EtatRapprochement.date_rapprochement) == mois
        )

    etats = query.order_by(EtatRapprochement.date_rapprochement.desc()).offset(skip)
    if limit is not None:
        etats = etats.limit(limit)
    etats = etats.all()


    result = []
    for e in etats:
        compte = db.query(Compte).filter(Compte.id_compte == e.id_compte).first()
        result.append({
            "id_rapprochement"  : e.id_rapprochement,
            "intitule"          : e.intitule,
            "id_compte"         : e.id_compte,
            "nom_compte"        : compte.nom_compte if compte else None,
            "num_compte"        : compte.num_compte if compte else None,
            "date_rapprochement": e.date_rapprochement,
            "mois"              : e.date_rapprochement.month,
            "annee"             : e.date_rapprochement.year,
            "solde_theorique"   : float(e.solde_theorique),
            "ecart"             : float(e.ecart),
        })
    return result


# ========== 2. LISTER PAR COMPTE ==========
@router.get("/compte/{compte_id}")
def get_rapprochements_by_compte(
    compte_id   : int,
    db          : Session     = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Rapprochements d'un compte donné (avec vérification des droits)."""
    compte = db.query(Compte).filter(Compte.id_compte == compte_id).first()
    if not compte:
        raise HTTPException(status_code=404, detail="Compte non trouvé")
    verifier_acces_compte(compte, current_user)

    etats = db.query(EtatRapprochement).filter(
        EtatRapprochement.id_compte == compte_id
    ).order_by(EtatRapprochement.date_rapprochement.desc()).all()

    return [
        {
            "id_rapprochement"  : e.id_rapprochement,
            "intitule"          : e.intitule,
            "date_rapprochement": e.date_rapprochement,
            "mois"              : e.date_rapprochement.month,
            "annee"             : e.date_rapprochement.year,
            "solde_theorique"   : float(e.solde_theorique),
            "ecart"             : float(e.ecart),
        }
        for e in etats
    ]


# ========== 3. VÉRIFIER L'EXISTENCE POUR UN MOIS ==========
@router.get("/verifier/mois")
def verifier_rapprochement_mois(
    id_compte   : int = Query(...),
    mois        : int = Query(..., ge=1, le=12),
    annee       : int = Query(..., ge=2000),
    db          : Session     = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Vérifie si un rapprochement existe déjà pour ce compte/mois/année.
    Retourne les données existantes si trouvé — utilisé par le frontend
    pour adapter l'affichage du formulaire (upsert UX).
    """
    compte = db.query(Compte).filter(Compte.id_compte == id_compte).first()
    if not compte:
        raise HTTPException(status_code=404, detail="Compte non trouvé")
    verifier_acces_compte(compte, current_user)

    existant = db.query(EtatRapprochement).filter(
        EtatRapprochement.id_compte == id_compte,
        extract("month", EtatRapprochement.date_rapprochement) == mois,
        extract("year",  EtatRapprochement.date_rapprochement) == annee,
    ).first()

    if not existant:
        return {"existe": False}

    return {
        "existe"                        : True,
        "id_rapprochement"              : existant.id_rapprochement,
        "intitule"                      : existant.intitule,
        "solde_balance"                 : float(existant.solde_balance),
        "operation_acct_non_constate"   : float(existant.operation_acct_non_constate),
        "operation_poste_non_constate"  : float(existant.operation_poste_non_constate),
        "solde_theorique"               : float(existant.solde_theorique),
        "ecart"                         : float(existant.ecart),
        "observation"                   : existant.observation,
    }


# ========== 4. CRÉER OU METTRE À JOUR (UPSERT PAR MOIS) ==========
@router.post("/", status_code=status.HTTP_200_OK)
def creer_ou_mettre_a_jour_rapprochement(
    data        : dict,
    db          : Session     = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Upsert — un seul rapprochement par compte par mois.
    - Aucun n'existe → création  → { action: 'cree' }
    - Existe déjà    → mise à jour des montants uniquement → { action: 'mis_a_jour' }
    Le compte, l'intitulé original et les infos de base ne sont PAS écrasés lors d'une MAJ.
    """
    # Vérifier le compte
    compte = db.query(Compte).filter(Compte.id_compte == data.get("id_compte")).first()
    if not compte:
        raise HTTPException(status_code=404, detail="Compte non trouvé")
    verifier_acces_compte(compte, current_user)

    # Extraire et valider la date
    date_rap_str = data.get("date_rapprochement")
    if not date_rap_str:
        raise HTTPException(
            status_code=400,
            detail="date_rapprochement est obligatoire (format YYYY-MM-DD)"
        )
    try:
        date_rap = date.fromisoformat(date_rap_str)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Format de date invalide. Utilisez YYYY-MM-DD"
        )

    mois  = date_rap.month
    annee = date_rap.year

    # Calculs financiers
    solde_balance = float(data.get("solde_balance",                0) or 0)
    op_acct       = float(data.get("operation_acct_non_constate",  0) or 0)
    op_poste      = float(data.get("operation_poste_non_constate", 0) or 0)
    solde_theorique, ecart = calculer_montants(solde_balance, op_acct, op_poste)

    # Chercher un existant pour ce compte/mois/année
    existant = db.query(EtatRapprochement).filter(
        EtatRapprochement.id_compte == data.get("id_compte"),
        extract("month", EtatRapprochement.date_rapprochement) == mois,
        extract("year",  EtatRapprochement.date_rapprochement) == annee,
    ).first()

    if existant:
        # ── Mise à jour — seuls les montants et l'observation changent ──────
        # Le compte, l'intitulé original et la date restent ceux de la création
        existant.solde_balance                = solde_balance
        existant.operation_acct_non_constate  = op_acct
        existant.operation_poste_non_constate = op_poste
        existant.solde_theorique              = solde_theorique
        existant.ecart                        = ecart
        existant.id_user                      = current_user.id_user

        # Observation : mise à jour si fournie
        if data.get("observation") is not None:
            existant.observation = data["observation"]

        db.commit()
        db.refresh(existant)

        mois_fr = ["","Janvier","Février","Mars","Avril","Mai","Juin",
                   "Juillet","Août","Septembre","Octobre","Novembre","Décembre"]
        return {
            "action"            : "mis_a_jour",
            "id_rapprochement"  : existant.id_rapprochement,
            "mois"              : mois,
            "annee"             : annee,
            "solde_balance"     : float(existant.solde_balance),
            "solde_theorique"   : float(existant.solde_theorique),
            "ecart"             : float(existant.ecart),
            "message"           : f"Montants du rapprochement de {mois_fr[mois]} {annee} mis à jour"
        }

    else:
        # ── Création ─────────────────────────────────────────────────────────
        etat = EtatRapprochement(
            id_compte                    = data.get("id_compte"),
            id_user                      = current_user.id_user,
            intitule                     = data.get("intitule") or f"Rapprochement {compte.nom_compte} {mois:02d}/{annee}",
            solde_balance                = solde_balance,
            operation_acct_non_constate  = op_acct,
            operation_poste_non_constate = op_poste,
            solde_theorique              = solde_theorique,
            ecart                        = ecart,
            observation                  = data.get("observation"),
            date_rapprochement           = date_rap
        )
        db.add(etat)
        db.commit()
        db.refresh(etat)

        mois_fr = ["","Janvier","Février","Mars","Avril","Mai","Juin",
                   "Juillet","Août","Septembre","Octobre","Novembre","Décembre"]
        return {
            "action"            : "cree",
            "id_rapprochement"  : etat.id_rapprochement,
            "mois"              : mois,
            "annee"             : annee,
            "solde_balance"     : float(etat.solde_balance),
            "solde_theorique"   : float(etat.solde_theorique),
            "ecart"             : float(etat.ecart),
            "message"           : f"Rapprochement de {mois_fr[mois]} {annee} créé avec succès"
        }


# ═══════════════════════════════════════════════════════════════════════════
# ROUTES DYNAMIQUES /{id} — toujours en dernier
# ═══════════════════════════════════════════════════════════════════════════

# ========== 5. DÉTAIL D'UN RAPPROCHEMENT ==========
@router.get("/{rapprochement_id}")
def get_rapprochement_by_id(
    rapprochement_id: int,
    db          : Session     = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Détail complet d'un rapprochement avec nom du compte."""
    rap = db.query(EtatRapprochement).filter(
        EtatRapprochement.id_rapprochement == rapprochement_id
    ).first()
    if not rap:
        raise HTTPException(status_code=404, detail="Rapprochement non trouvé")
    verifier_acces_rapprochement(rap, db, current_user)

    compte = db.query(Compte).filter(Compte.id_compte == rap.id_compte).first()

    return {
        "id_rapprochement"              : rap.id_rapprochement,
        "intitule"                      : rap.intitule,
        "id_compte"                     : rap.id_compte,
        "nom_compte"                    : compte.nom_compte if compte else None,
        "num_compte"                    : compte.num_compte if compte else None,
        "id_user"                       : rap.id_user,
        "mois"                          : rap.date_rapprochement.month,
        "annee"                         : rap.date_rapprochement.year,
        "date_rapprochement"            : rap.date_rapprochement,
        "solde_balance"                 : float(rap.solde_balance),
        "operation_acct_non_constate"   : float(rap.operation_acct_non_constate),
        "operation_poste_non_constate"  : float(rap.operation_poste_non_constate),
        "solde_theorique"               : float(rap.solde_theorique),
        "ecart"                         : float(rap.ecart),
        "observation"                   : rap.observation,
    }


# ========== 6. SUPPRIMER UN RAPPROCHEMENT ==========
@router.delete("/{rapprochement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_rapprochement(
    rapprochement_id: int,
    db          : Session     = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Suppression d'un rapprochement (ADMIN ou RECEVEUR du poste propriétaire)."""
    rap = db.query(EtatRapprochement).filter(
        EtatRapprochement.id_rapprochement == rapprochement_id
    ).first()
    if not rap:
        raise HTTPException(status_code=404, detail="Rapprochement non trouvé")
    verifier_acces_rapprochement(rap, db, current_user)

    db.delete(rap)
    db.commit()


# ========== 7. EXPORT PDF ==========
@router.get("/{rapprochement_id}/pdf")
def export_rapprochement_pdf(
    rapprochement_id: int,
    orientation : str = Query("portrait", regex="^(portrait|paysage)$"),
    db          : Session     = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Export PDF du rapprochement (portrait ou paysage)."""
    rap = db.query(EtatRapprochement).filter(
        EtatRapprochement.id_rapprochement == rapprochement_id
    ).first()
    if not rap:
        raise HTTPException(status_code=404, detail="Rapprochement non trouvé")
    verifier_acces_rapprochement(rap, db, current_user)

    compte = db.query(Compte).filter(Compte.id_compte == rap.id_compte).first()
    if not compte:
        raise HTTPException(status_code=404, detail="Compte introuvable")

    poste = None
    if compte.id_poste:
        poste = db.query(Poste).filter(Poste.id_poste == compte.id_poste).first()

    pdf_bytes = generate_pdf(rap, compte, current_user, poste, orientation)

    return Response(
        content    = pdf_bytes,
        media_type = "application/pdf",
        headers    = {
            "Content-Disposition":
                f'attachment; filename="Rapprochement_{compte.num_compte}_{rap.date_rapprochement}.pdf"'
        }
    )