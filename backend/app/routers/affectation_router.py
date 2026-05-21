# app/routers/affectation_router.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date
from app.database import get_db
from app.models import Affectation, Utilisateur, Poste
from app.security.auth import get_current_user
from datetime import date, timedelta

router = APIRouter(tags=["Affectations"])

@router.get("/")
def get_all_affectations(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    if current_user.role not in ["ADMIN"]:
        raise HTTPException(status_code=403, detail="Droits insuffisants")
    
    affectations = db.query(Affectation).offset(skip).limit(limit).all()
    return [
        {
            "id_affectation": a.id_affectation,
            "id_user": a.id_user,
            "id_poste": a.id_poste,
            "date_debut": a.date_debut,
            "date_fin": a.date_fin,
            "created_at": a.created_at
        }
        for a in affectations
    ]

@router.get("/utilisateur/{user_id}")
def get_affectations_by_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    affectations = db.query(Affectation).filter(Affectation.id_user == user_id).all()
    return [
        {
            "id_affectation": a.id_affectation,
            "id_poste": a.id_poste,
            "date_debut": a.date_debut,
            "date_fin": a.date_fin
        }
        for a in affectations
    ]

@router.get("/poste/{poste_id}")
def get_affectations_by_poste(
    poste_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    affectations = db.query(Affectation).filter(Affectation.id_poste == poste_id).all()
    return [
        {
            "id_affectation": a.id_affectation,
            "id_user": a.id_user,
            "date_debut": a.date_debut,
            "date_fin": a.date_fin
        }
        for a in affectations
    ]

@router.get("/actives")
def get_affectations_actives(
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Récupère les affectations en cours (date_fin = NULL)"""
    affectations = db.query(Affectation).filter(Affectation.date_fin.is_(None)).all()
    return [
        {
            "id_affectation": a.id_affectation,
            "id_user": a.id_user,
            "id_poste": a.id_poste,
            "date_debut": a.date_debut
        }
        for a in affectations
    ]

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_affectation(
    data: dict,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    if current_user.role not in ["ADMIN"]:
        raise HTTPException(status_code=403, detail="Droits insuffisants")
    
    # Vérifier l'utilisateur
    user = db.query(Utilisateur).filter(Utilisateur.id_user == data.get("id_user")).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    # Vérifier le poste
    poste = db.query(Poste).filter(Poste.id_poste == data.get("id_poste")).first()
    if not poste:
        raise HTTPException(status_code=404, detail="Poste non trouvé")
    
    # Date de début de la nouvelle affectation
    date_debut_nouvelle = date.fromisoformat(data.get("date_debut")) if data.get("date_debut") else date.today()
    
    # 1. Terminer TOUTES les affectations actives de l'utilisateur
    affectations_actives = db.query(Affectation).filter(
        Affectation.id_user == user.id_user,
        Affectation.date_fin.is_(None)
    ).all()
    
    for ancienne in affectations_actives:
        ancienne.date_fin = date_debut_nouvelle - timedelta(days=1)
        print(f"✅ Affectation (poste_id={ancienne.id_poste}) terminée le {ancienne.date_fin}")
    
    # 2. Vérifier si l'utilisateur a déjà une affectation pour ce poste dans le passé
    affectation_existante = db.query(Affectation).filter(
        Affectation.id_user == user.id_user,
        Affectation.id_poste == data.get("id_poste"),
        Affectation.date_fin.isnot(None)
    ).order_by(Affectation.date_fin.desc()).first()
    
    if affectation_existante:
        # Réactiver l'ancienne affectation
        affectation_existante.date_fin = None
        affectation_existante.date_debut = date_debut_nouvelle
        db.add(affectation_existante)
        nouvelle_affectation = affectation_existante
        print(f"✅ Réactivation de l'ancienne affectation pour le poste {poste.nom_poste}")
    else:
        # Créer une nouvelle affectation
        nouvelle_affectation = Affectation(
            id_user=data.get("id_user"),
            id_poste=data.get("id_poste"),
            date_debut=date_debut_nouvelle,
            date_fin=None
        )
        db.add(nouvelle_affectation)
        print(f"✅ Nouvelle affectation créée pour le poste {poste.nom_poste}")
    
    # 3. Mettre à jour le poste_id de l'utilisateur
    user.poste_id = data.get("id_poste")
    
    db.commit()
    db.refresh(nouvelle_affectation)
    
    return {
        "id_affectation": nouvelle_affectation.id_affectation,
        "id_user": nouvelle_affectation.id_user,
        "id_poste": nouvelle_affectation.id_poste,
        "date_debut": nouvelle_affectation.date_debut,
        "date_fin": nouvelle_affectation.date_fin,
        "ancien_poste_termine": [a.id_poste for a in affectations_actives] if affectations_actives else []
    }


@router.put("/{affectation_id}")
def update_affectation(
    affectation_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    if current_user.role not in ["ADMIN"]:
        raise HTTPException(status_code=403, detail="Droits insuffisants")
    
    affectation = db.query(Affectation).filter(Affectation.id_affectation == affectation_id).first()
    if not affectation:
        raise HTTPException(status_code=404, detail="Affectation non trouvée")
    
    if "date_fin" in data:
        affectation.date_fin = date.fromisoformat(data["date_fin"]) if data["date_fin"] else None
    
    db.commit()
    
    return {
        "id_affectation": affectation.id_affectation,
        "date_fin": affectation.date_fin
    }

@router.delete("/{affectation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_affectation(
    affectation_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    if current_user.role not in ["ADMIN"]:
        raise HTTPException(status_code=403, detail="Droits insuffisants")
    
    affectation = db.query(Affectation).filter(Affectation.id_affectation == affectation_id).first()
    if not affectation:
        raise HTTPException(status_code=404, detail="Affectation non trouvée")
    
    db.delete(affectation)
    db.commit()