# app/routers/ligne_budgetaire_router.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.dependencies import get_db
from app.security.auth import get_current_user
from app.models.ligne_budgetaire import LigneBudgetaire
from app.models import Utilisateur
from app.schemas.ligne_budgetaire import (
    LigneBudgetaireCreate,
    LigneBudgetaireResponse,
    LigneBudgetaireVerifyResponse,
    LigneBudgetaireBulkCreate
)

router = APIRouter(tags=["Lignes Budgétaires"])

def verifier_admin(current_user: Utilisateur):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Droits insuffisants.")

# Liste toutes les lignes (globales)
@router.get("/", response_model=List[LigneBudgetaireResponse])
def get_all_lignes(
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    return db.query(LigneBudgetaire).all()

# Vérification par num_ligne uniquement (plus de id_poste)
@router.get("/verify/{num_ligne}", response_model=LigneBudgetaireVerifyResponse)
def verify(
    num_ligne: str,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    ligne = db.query(LigneBudgetaire).filter(LigneBudgetaire.num_ligne == num_ligne).first()
    if not ligne:
        raise HTTPException(404, f"Ligne '{num_ligne}' introuvable")
    return ligne

# Création unitaire
@router.post("/", response_model=LigneBudgetaireResponse, status_code=201)
def creer(
    data: LigneBudgetaireCreate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    if current_user.role not in ["ADMIN", "RECEVEUR"]:
        raise HTTPException(403, "Droits insuffisants")
    existing = db.query(LigneBudgetaire).filter(LigneBudgetaire.num_ligne == data.num_ligne).first()
    if existing:
        raise HTTPException(400, f"La ligne {data.num_ligne} existe déjà.")
    ligne = LigneBudgetaire(**data.model_dump())
    db.add(ligne)
    db.commit()
    db.refresh(ligne)
    return ligne

# Recherche par num_ligne (alias)
@router.get("/recherche/{num_ligne}", response_model=LigneBudgetaireResponse)
def rechercher_ligne_par_num(
    num_ligne: str,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    ligne = db.query(LigneBudgetaire).filter(LigneBudgetaire.num_ligne == num_ligne).first()
    if not ligne:
        raise HTTPException(404, "Ligne budgétaire non trouvée.")
    return ligne

# Mise à jour d'une ligne budgétaire
@router.put("/{id}", response_model=LigneBudgetaireResponse)
def update_ligne(
    id: int,
    data: LigneBudgetaireCreate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    verifier_admin(current_user)
    ligne = db.query(LigneBudgetaire).filter(LigneBudgetaire.id == id).first()
    if not ligne:
        raise HTTPException(404, "Ligne non trouvée")
    # Vérifier que le nouveau num_ligne n'est pas déjà utilisé par une autre ligne
    existing = db.query(LigneBudgetaire).filter(
        LigneBudgetaire.num_ligne == data.num_ligne,
        LigneBudgetaire.id != id
    ).first()
    if existing:
        raise HTTPException(400, f"La ligne {data.num_ligne} existe déjà.")
    # Mise à jour
    ligne.num_ligne = data.num_ligne
    ligne.intitule = data.intitule
    ligne.code_taxe = data.code_taxe
    db.commit()
    db.refresh(ligne)
    return ligne


# Création en masse (bulk)
@router.post("/bulk", response_model=List[LigneBudgetaireResponse], status_code=201)
def create_multiple_lignes(
    data: LigneBudgetaireBulkCreate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    verifier_admin(current_user)
    created = []
    for item in data.lignes:
        existing = db.query(LigneBudgetaire).filter(LigneBudgetaire.num_ligne == item.num_ligne).first()
        if existing:
            raise HTTPException(400, f"La ligne {item.num_ligne} existe déjà.")
        ligne = LigneBudgetaire(
            num_ligne=item.num_ligne,
            intitule=item.intitule,
            code_taxe=item.code_taxe
        )
        db.add(ligne)
        created.append(ligne)
    db.commit()
    for ligne in created:
        db.refresh(ligne)
    return created

# Suppression
@router.delete("/{id}", status_code=204)
def supprimer(
    id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    verifier_admin(current_user)
    ligne = db.query(LigneBudgetaire).filter(LigneBudgetaire.id == id).first()
    if not ligne:
        raise HTTPException(404, "Ligne non trouvée")
    db.delete(ligne)
    db.commit()