# app/routers/etat_encaissement_router.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.database import get_db
from app.models import EtatEncaissement, Unite, LigneBudgetaire, Utilisateur
from app.schemas.etat_encaissement import EtatEncaissementCreate, EtatEncaissementResponse
from app.security.auth import get_current_user

router = APIRouter()


@router.post("/", response_model=EtatEncaissementResponse, status_code=201)
def create_encaissement(
    data: EtatEncaissementCreate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    # Vérifier l'unité
    unite = db.query(Unite).filter(Unite.id_unite == data.id_unite).first()
    if not unite:
        raise HTTPException(404, "Unité non trouvée")
    if current_user.role != "ADMIN" and current_user.poste_id != unite.id_poste:
        raise HTTPException(403, "Accès non autorisé à cette unité")

    # Récupérer la ligne budgétaire par numéro
    ligne = db.query(LigneBudgetaire).filter(
        LigneBudgetaire.num_ligne == data.num_ligne
    ).first()
    if not ligne:
        raise HTTPException(404, f"Ligne budgétaire '{data.num_ligne}' non trouvée")

    # Créer l'encaissement
    encaissement = EtatEncaissement(
        id_unite=data.id_unite,
        id_ligne=ligne.id,
        id_user=current_user.id_user,
        date_encaissement=data.date_encaissement,
        mois=data.date_encaissement.month,
        annee=data.date_encaissement.year,
        montant=data.montant
    )
    try:
        db.add(encaissement)
        db.commit()
        db.refresh(encaissement)
    except IntegrityError:
        db.rollback()
        raise HTTPException(400, "Erreur lors de l'enregistrement de l'encaissement")

    return {
        "id_encaissement": encaissement.id_encaissement,
        "id_unite":        encaissement.id_unite,
        "id_ligne":        encaissement.id_ligne,
        "date_encaissement": encaissement.date_encaissement,
        "montant":         encaissement.montant,
        "id_user":         encaissement.id_user,
        "date_creation":   encaissement.date_creation,
        "num_ligne":       ligne.num_ligne,
        "intitule":        ligne.intitule,
        "code_taxe":       ligne.code_taxe,
        "mois":            encaissement.mois,
        "annee":           encaissement.annee,
    }


@router.get("/unite/{unite_id}")
def get_encaissements_by_unite(
    unite_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    unite = db.query(Unite).filter(Unite.id_unite == unite_id).first()
    if not unite:
        raise HTTPException(404, "Unité non trouvée")
    if current_user.role != "ADMIN" and current_user.poste_id != unite.id_poste:
        raise HTTPException(403, "Accès non autorisé")

    # ← JOIN explicite sur LigneBudgetaire — évite le problème de relation
    rows = (
        db.query(EtatEncaissement, LigneBudgetaire)
        .join(LigneBudgetaire, LigneBudgetaire.id == EtatEncaissement.id_ligne)
        .filter(EtatEncaissement.id_unite == unite_id)
        .order_by(EtatEncaissement.date_encaissement.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return [
        {
            "id_encaissement":   e.id_encaissement,
            "id_unite":          e.id_unite,
            "id_ligne":          e.id_ligne,
            "date_encaissement": e.date_encaissement,
            "montant":           e.montant,
            "id_user":           e.id_user,
            "date_creation":     e.date_creation,   # ← cohérent avec le POST
            "num_ligne":         ligne.num_ligne,
            "intitule":          ligne.intitule,
            "code_taxe":         ligne.code_taxe,
            "mois":              e.mois,
            "annee":             e.annee,
        }
        for e, ligne in rows
    ]

@router.put("/{encaissement_id}", response_model=EtatEncaissementResponse)
def update_encaissement(
    encaissement_id: int,
    data: EtatEncaissementCreate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    enc = db.query(EtatEncaissement).filter(
        EtatEncaissement.id_encaissement == encaissement_id
    ).first()
    if not enc:
        raise HTTPException(404, "Encaissement non trouvé")

    # Vérifier accès à l'unité
    unite = db.query(Unite).filter(Unite.id_unite == enc.id_unite).first()
    if current_user.role != "ADMIN" and current_user.poste_id != unite.id_poste:
        raise HTTPException(403, "Accès non autorisé")

    # Récupérer la nouvelle ligne budgétaire
    ligne = db.query(LigneBudgetaire).filter(
        LigneBudgetaire.num_ligne == data.num_ligne
    ).first()
    if not ligne:
        raise HTTPException(404, f"Ligne budgétaire '{data.num_ligne}' non trouvée")

    # Mettre à jour
    enc.id_unite          = data.id_unite
    enc.id_ligne          = ligne.id
    enc.date_encaissement = data.date_encaissement
    enc.mois              = data.date_encaissement.month
    enc.annee             = data.date_encaissement.year
    enc.montant           = data.montant

    db.commit()
    db.refresh(enc)

    return {
        "id_encaissement":   enc.id_encaissement,
        "id_unite":          enc.id_unite,
        "id_ligne":          enc.id_ligne,
        "date_encaissement": enc.date_encaissement,
        "montant":           enc.montant,
        "id_user":           enc.id_user,
        "date_creation":     enc.date_creation,
        "num_ligne":         ligne.num_ligne,
        "intitule":          ligne.intitule,
        "code_taxe":         ligne.code_taxe,
        "mois":              enc.mois,
        "annee":             enc.annee,
    }


@router.delete("/{encaissement_id}", status_code=200)
def delete_encaissement(
    encaissement_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    enc = db.query(EtatEncaissement).filter(
        EtatEncaissement.id_encaissement == encaissement_id
    ).first()
    if not enc:
        raise HTTPException(404, "Encaissement non trouvé")

    # Vérifier accès
    unite = db.query(Unite).filter(Unite.id_unite == enc.id_unite).first()
    if current_user.role != "ADMIN" and current_user.poste_id != unite.id_poste:
        raise HTTPException(403, "Accès non autorisé")

    db.delete(enc)
    db.commit()
    return {"message": "Encaissement supprimé avec succès"}