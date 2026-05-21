# app/routers/poste_router.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field
from app.database import get_db
from app.models import Poste, Utilisateur
from app.security.auth import get_current_user

router = APIRouter(tags=["Postes"])


# ============================================================
# SCHÉMAS
# ============================================================

class PosteCreate(BaseModel):
    code_poste: str = Field(..., min_length=1, max_length=20)
    nom_poste:  str = Field(..., min_length=2, max_length=100)
    adresse:    Optional[str] = None


class PosteUpdate(BaseModel):
    nom_poste: Optional[str] = Field(None, min_length=2, max_length=100)
    adresse:   Optional[str] = None


class PosteResponse(BaseModel):
    id_poste:   int
    code_poste: str
    nom_poste:  str
    adresse:    Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============================================================
# HELPER PERMISSION
# ============================================================

def exiger_admin(current_user: Utilisateur):
    """Lève une 403 si l'utilisateur n'est pas ADMIN."""
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Réservé à l'administrateur."
        )


# ============================================================
# LECTURE  — ADMIN + RECEVEUR
# ============================================================

@router.get("/", response_model=List[PosteResponse])
def get_all_postes(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user),
):
    """Liste tous les postes. Accessible : ADMIN, RECEVEUR."""
    return db.query(Poste).offset(skip).limit(limit).all()


@router.get("/code/{code_poste}", response_model=PosteResponse)
def get_poste_by_code(
    code_poste: str,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user),
):
    """Recherche un poste par code. Accessible : ADMIN, RECEVEUR."""
    poste = db.query(Poste).filter(Poste.code_poste == code_poste).first()
    if not poste:
        raise HTTPException(status_code=404, detail="Poste non trouvé.")
    return poste


@router.get("/{poste_id}", response_model=PosteResponse)
def get_poste_by_id(
    poste_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user),
):
    """Détail d'un poste. Accessible : ADMIN, RECEVEUR."""
    poste = db.query(Poste).filter(Poste.id_poste == poste_id).first()
    if not poste:
        raise HTTPException(status_code=404, detail="Poste non trouvé.")
    return poste


# ============================================================
# CRÉATION  — ADMIN uniquement
# ============================================================

@router.post("/", response_model=PosteResponse, status_code=status.HTTP_201_CREATED)
def create_poste(
    data: PosteCreate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user),
):
    """Crée un nouveau poste. Réservé : ADMIN uniquement."""
    exiger_admin(current_user)

    if db.query(Poste).filter(Poste.code_poste == data.code_poste).first():
        raise HTTPException(status_code=400, detail="Ce code poste existe déjà.")

    poste = Poste(
        code_poste = data.code_poste,
        nom_poste  = data.nom_poste,
        adresse    = data.adresse,
    )
    db.add(poste)
    db.commit()
    db.refresh(poste)
    return poste


# ============================================================
# MISE À JOUR  — ADMIN uniquement
# ============================================================

@router.put("/{poste_id}", response_model=PosteResponse)
def update_poste(
    poste_id: int,
    data: PosteUpdate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user),
):
    """Met à jour un poste. Réservé : ADMIN uniquement."""
    exiger_admin(current_user)

    poste = db.query(Poste).filter(Poste.id_poste == poste_id).first()
    if not poste:
        raise HTTPException(status_code=404, detail="Poste non trouvé.")

    if data.nom_poste is not None:
        poste.nom_poste = data.nom_poste
    if data.adresse is not None:
        poste.adresse = data.adresse

    db.commit()
    db.refresh(poste)
    return poste


# ============================================================
# SUPPRESSION  — ADMIN uniquement
# ============================================================

@router.delete("/{poste_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_poste(
    poste_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user),
):
    """
    Supprime un poste. Réservé : ADMIN uniquement.
    Échoue si des utilisateurs sont encore affectés à ce poste (contrainte FK).
    """
    exiger_admin(current_user)

    poste = db.query(Poste).filter(Poste.id_poste == poste_id).first()
    if not poste:
        raise HTTPException(status_code=404, detail="Poste non trouvé.")

    # Vérifier qu'aucun utilisateur n'est encore affecté
    if db.query(Utilisateur).filter(Utilisateur.poste_id == poste_id).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Impossible de supprimer ce poste : des utilisateurs y sont encore affectés."
        )

    db.delete(poste)
    db.commit()