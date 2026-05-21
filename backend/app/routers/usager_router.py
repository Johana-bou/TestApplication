# app/routers/usager_router.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Usager, Compte, Utilisateur
from app.security.auth import get_current_user

router = APIRouter(tags=["Usagers"])

@router.get("/")
def get_all_usagers(
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    usagers = db.query(Usager).offset(skip).limit(limit).all()
    return [
        {"id_usager": u.id_usager, "nom_usager": u.nom_usager,
         "raison_sociale": u.raison_sociale, "telephone": u.telephone,
         "id_compte": u.id_compte, "created_at": u.created_at}
        for u in usagers
    ]

@router.get("/compte/{compte_id}")
def get_usagers_by_compte(
    compte_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    usagers = db.query(Usager).filter(Usager.id_compte == compte_id).all()
    return [
        {"id_usager": u.id_usager, "nom_usager": u.nom_usager,
         "raison_sociale": u.raison_sociale, "telephone": u.telephone}
        for u in usagers
    ]

@router.get("/{usager_id}")
def get_usager_by_id(
    usager_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    usager = db.query(Usager).filter(Usager.id_usager == usager_id).first()
    if not usager:
        raise HTTPException(status_code=404, detail="Usager non trouvé")
    return {"id_usager": usager.id_usager, "nom_usager": usager.nom_usager,
            "raison_sociale": usager.raison_sociale, "telephone": usager.telephone,
            "id_compte": usager.id_compte, "created_at": usager.created_at}

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_usager(
    data: dict,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    # ✅ ADMIN et RECEVEUR peuvent créer un usager
    compte = db.query(Compte).filter(Compte.id_compte == data.get("id_compte")).first()
    if not compte:
        raise HTTPException(status_code=404, detail="Compte non trouvé")

    usager = Usager(
        nom_usager=data.get("nom_usager"),
        raison_sociale=data.get("raison_sociale"),
        telephone=data.get("telephone"),
        id_compte=data.get("id_compte")
    )
    db.add(usager)
    db.commit()
    db.refresh(usager)
    return {"id_usager": usager.id_usager, "nom_usager": usager.nom_usager, "id_compte": usager.id_compte}

@router.put("/{usager_id}")
def update_usager(
    usager_id: int, data: dict,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    # ✅ ADMIN et RECEVEUR peuvent modifier
    usager = db.query(Usager).filter(Usager.id_usager == usager_id).first()
    if not usager:
        raise HTTPException(status_code=404, detail="Usager non trouvé")

    if "nom_usager" in data:
        usager.nom_usager = data["nom_usager"]
    if "raison_sociale" in data:
        usager.raison_sociale = data["raison_sociale"]
    if "telephone" in data:
        usager.telephone = data["telephone"]

    db.commit()
    db.refresh(usager)
    return {"id_usager": usager.id_usager, "nom_usager": usager.nom_usager, "telephone": usager.telephone}

@router.delete("/{usager_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_usager(
    usager_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    # 🔒 ADMIN uniquement
    if current_user.role not in ["ADMIN"]:
        raise HTTPException(status_code=403, detail="Droits insuffisants")

    usager = db.query(Usager).filter(Usager.id_usager == usager_id).first()
    if not usager:
        raise HTTPException(status_code=404, detail="Usager non trouvé")

    db.delete(usager)
    db.commit()