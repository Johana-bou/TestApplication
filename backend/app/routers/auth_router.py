# app/routers/auth_router.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Poste, Utilisateur
from app.security.jwt import verify_password, create_access_token
from pydantic import BaseModel
from datetime import date
from app.models import Affectation

router = APIRouter(tags=["Authentification"])

class PosteChoice(BaseModel):
    code_poste: str

class LoginRequest(BaseModel):
    code_poste: str
    pseudo: str
    mot_de_passe: str

@router.get("/postes")
def get_postes(db: Session = Depends(get_db)):
    postes = db.query(Poste).all()
    return [
        {
            "id_poste": p.id_poste,
            "code_poste": p.code_poste,
            "nom_poste": p.nom_poste,
            "adresse": p.adresse
        }
        for p in postes
    ]

@router.post("/postes/verify")
def verify_poste(data: PosteChoice, db: Session = Depends(get_db)):
    poste = db.query(Poste).filter(Poste.code_poste == data.code_poste).first()
    if not poste:
        raise HTTPException(status_code=404, detail="Code poste invalide")
    return {"valid": True, "id_poste": poste.id_poste, "nom_poste": poste.nom_poste}

@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    poste = db.query(Poste).filter(Poste.code_poste == request.code_poste).first()
    if not poste:
        raise HTTPException(status_code=401, detail="Code poste invalide")
    
    user = db.query(Utilisateur).filter(Utilisateur.pseudo == request.pseudo).first()
    if not user or not verify_password(request.mot_de_passe, user.mot_de_passe):
        raise HTTPException(status_code=401, detail="Pseudo ou mot de passe incorrect")
    
    if not user.actif:
        raise HTTPException(status_code=403, detail="Compte désactivé")
    
    today = date.today()
    affectation_active = db.query(Affectation).filter(
        Affectation.id_user == user.id_user,
        Affectation.id_poste == poste.id_poste,
        Affectation.date_debut <= today,
        (Affectation.date_fin.is_(None)) | (Affectation.date_fin >= today)
    ).first()

    print(f"=== Connexion de {user.pseudo} vers {poste.nom_poste} ===")
    print(f"Date aujourd'hui: {today}")
    print(f"Affectation trouvée: {affectation_active is not None}")
    
    if not affectation_active and user.role != "ADMIN":
        raise HTTPException(
            status_code=403,
            detail=f"Vous n'êtes pas affecté au poste {poste.nom_poste}"
        )
    
    access_token = create_access_token(data={
        "sub": str(user.id_user),
        "poste_id": poste.id_poste,
        "pseudo": user.pseudo,
        "role": user.role
    })
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id_user": user.id_user,
            "pseudo": user.pseudo,
            "nom": user.nom,
            "prenom": user.prenom,
            "role": user.role
        },
        "poste": {
            "id_poste": poste.id_poste,
            "code_poste": poste.code_poste,
            "nom_poste": poste.nom_poste
        }
    }