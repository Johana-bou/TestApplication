# app/routers/compte_router.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Compte, Poste, Utilisateur
from app.security.auth import get_current_user

router = APIRouter(tags=["Comptes"])

@router.get("/")
def get_all_comptes(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    # Filtrer selon le rôle
    if current_user.role == "ADMIN":
        query = db.query(Compte)
    else:
        # RECEVEUR : ne voir que les comptes de son poste
        query = db.query(Compte).filter(Compte.id_poste == current_user.poste_id)
    
    comptes = query.offset(skip).limit(limit).all()
    return [
        {
            "id_compte": c.id_compte,
            "num_compte": c.num_compte,
            "nom_compte": c.nom_compte,
            "id_poste": c.id_poste,
            "created_at": c.created_at
        }
        for c in comptes
    ]

@router.get("/poste/{poste_id}")
def get_comptes_by_poste(
    poste_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    # Vérifier les droits d'accès au poste
    if current_user.role != "ADMIN" and current_user.poste_id != poste_id:
        raise HTTPException(status_code=403, detail="Accès non autorisé à ce poste")
    
    comptes = db.query(Compte).filter(Compte.id_poste == poste_id).all()
    return [
        {
            "id_compte": c.id_compte,
            "num_compte": c.num_compte,
            "nom_compte": c.nom_compte
        }
        for c in comptes
    ]

@router.get("/generaux")
def get_comptes_generaux(
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    # Les comptes généraux (sans poste) sont visibles par tous
    comptes = db.query(Compte).filter(Compte.id_poste.is_(None)).all()
    return [
        {
            "id_compte": c.id_compte,
            "num_compte": c.num_compte,
            "nom_compte": c.nom_compte
        }
        for c in comptes
    ]

@router.get("/{compte_id}")
def get_compte_by_id(
    compte_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    compte = db.query(Compte).filter(Compte.id_compte == compte_id).first()
    if not compte:
        raise HTTPException(status_code=404, detail="Compte non trouvé")
    
    # Vérifier l'accès : ADMIN ou propriétaire du poste
    if current_user.role != "ADMIN" and compte.id_poste != current_user.poste_id:
        raise HTTPException(status_code=403, detail="Accès non autorisé à ce compte")
    
    return {
        "id_compte": compte.id_compte,
        "num_compte": compte.num_compte,
        "nom_compte": compte.nom_compte,
        "id_poste": compte.id_poste,
        "created_at": compte.created_at
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_compte(
    data: dict,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Droits insuffisants")
    
    existing = db.query(Compte).filter(Compte.num_compte == data.get("num_compte")).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ce numéro de compte existe déjà")
    
    if data.get("id_poste"):
        poste = db.query(Poste).filter(Poste.id_poste == data.get("id_poste")).first()
        if not poste:
            raise HTTPException(status_code=404, detail="Poste non trouvé")
    
    compte = Compte(
        num_compte=data.get("num_compte"),
        nom_compte=data.get("nom_compte"),
        id_poste=data.get("id_poste")
    )
    db.add(compte)
    db.commit()
    db.refresh(compte)
    
    return {
        "id_compte": compte.id_compte,
        "num_compte": compte.num_compte,
        "nom_compte": compte.nom_compte,
        "id_poste": compte.id_poste
    }

@router.put("/{compte_id}")
def update_compte(
    compte_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Droits insuffisants")
    
    compte = db.query(Compte).filter(Compte.id_compte == compte_id).first()
    if not compte:
        raise HTTPException(status_code=404, detail="Compte non trouvé")
    
    if "nom_compte" in data:
        compte.nom_compte = data["nom_compte"]
    
    db.commit()
    db.refresh(compte)
    
    return {
        "id_compte": compte.id_compte,
        "num_compte": compte.num_compte,
        "nom_compte": compte.nom_compte,
        "id_poste": compte.id_poste
    }

@router.delete("/{compte_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_compte(
    compte_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Droits insuffisants")
    
    compte = db.query(Compte).filter(Compte.id_compte == compte_id).first()
    if not compte:
        raise HTTPException(status_code=404, detail="Compte non trouvé")
    
    db.delete(compte)
    db.commit()