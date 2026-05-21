# app/routers/utilisateur_router.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import date

from app.database import get_db
from app.models import Utilisateur, Poste, Affectation
from app.schemas.utilisateur import UtilisateurCreate, UtilisateurUpdate, UtilisateurResponse
from app.security.auth import get_current_user
from app.security.jwt import get_password_hash

router = APIRouter(tags=["Utilisateurs"])


# ============================================================
# HELPERS DE PERMISSIONS
# ============================================================

def exiger_admin(current_user: Utilisateur):
    """Lève une 403 si l'utilisateur n'est pas ADMIN."""
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Réservé à l'administrateur."
        )

def exiger_admin_ou_receveur(current_user: Utilisateur):
    """Lève une 403 si l'utilisateur n'est ni ADMIN ni RECEVEUR."""
    if current_user.role not in ("ADMIN", "RECEVEUR"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé."
        )


# ============================================================
# LECTURE
# ============================================================

@router.get("/", response_model=List[UtilisateurResponse])
def get_all_utilisateurs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user),
):
    """
    Liste tous les utilisateurs.
    Accessible : ADMIN, RECEVEUR
    """
    exiger_admin_ou_receveur(current_user)
    return db.query(Utilisateur).offset(skip).limit(limit).all()


@router.get("/poste/{poste_id}", response_model=List[UtilisateurResponse])
def get_utilisateurs_by_poste(
    poste_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user),
):
    """
    Liste les utilisateurs d'un poste donné.
    Accessible : ADMIN, RECEVEUR
    """
    exiger_admin_ou_receveur(current_user)
    return db.query(Utilisateur).filter(Utilisateur.poste_id == poste_id).all()


@router.get("/moi", response_model=UtilisateurResponse)
def get_mon_profil(
    current_user: Utilisateur = Depends(get_current_user),
):
    """Retourne le profil de l'utilisateur connecté."""
    return current_user


@router.get("/{user_id}", response_model=UtilisateurResponse)
def get_utilisateur_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user),
):
    """
    Détail d'un utilisateur.
    Accessible : ADMIN, RECEVEUR, ou l'utilisateur lui-même.
    """
    # Chaque utilisateur peut consulter son propre profil
    if current_user.id_user != user_id:
        exiger_admin_ou_receveur(current_user)

    user = db.query(Utilisateur).filter(Utilisateur.id_user == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé.")
    return user


# ============================================================
# CRÉATION  (ADMIN uniquement)
# ============================================================

@router.post("/", response_model=UtilisateurResponse, status_code=status.HTTP_201_CREATED)
def create_utilisateur(
    data: UtilisateurCreate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user),
):
    """
    Crée un nouvel utilisateur et l'affecte automatiquement au poste choisi.
    """
    exiger_admin(current_user)

    # Vérifier pseudo unique
    if db.query(Utilisateur).filter(Utilisateur.pseudo == data.pseudo).first():
        raise HTTPException(status_code=400, detail="Ce pseudo est déjà utilisé.")

    # Vérifier email unique (si fourni)
    if data.email and db.query(Utilisateur).filter(Utilisateur.email == data.email).first():
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé.")

    # Vérifier que le poste existe
    poste = db.query(Poste).filter(Poste.id_poste == data.poste_id).first()
    if not poste:
        raise HTTPException(status_code=404, detail="Poste non trouvé.")

    # Créer l'utilisateur
    user = Utilisateur(
        nom=data.nom,
        prenom=data.prenom,
        pseudo=data.pseudo,
        email=data.email,
        mot_de_passe=get_password_hash(data.mot_de_passe),
        role=data.role,
        poste_id=data.poste_id,  # Poste actuel
        actif=True,
    )
    db.add(user)
    db.flush()  # Pour obtenir user.id_user

    # ⚠️ CRÉER L'AFFECTATION AUTOMATIQUEMENT
    affectation = Affectation(
        id_user=user.id_user,
        id_poste=data.poste_id,
        date_debut=date.today(),
        date_fin=None,  # Affectation en cours
    )
    db.add(affectation)
    
    db.commit()
    db.refresh(user)
    
    return user

# ============================================================
# MISE À JOUR
# ============================================================

@router.put("/{user_id}", response_model=UtilisateurResponse)
def update_utilisateur(
    user_id: int,
    data: UtilisateurUpdate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user),
):
    """
    Met à jour un utilisateur.
    - Chaque utilisateur peut modifier son propre profil (nom, prénom, email, mot de passe).
    - Seul l'ADMIN peut modifier le rôle et le statut actif/inactif.
    - Le RECEVEUR ne peut pas modifier d'autres comptes.
    """
    user = db.query(Utilisateur).filter(Utilisateur.id_user == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé.")

    # Un RECEVEUR ne peut modifier que son propre compte
    if current_user.role == "RECEVEUR" and current_user.id_user != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous ne pouvez modifier que votre propre profil."
        )

    # Champs libres (soi-même ou ADMIN)
    if data.nom is not None:
        user.nom = data.nom
    if data.prenom is not None:
        user.prenom = data.prenom
    if data.email is not None:
        # Vérifier unicité email
        doublon = db.query(Utilisateur).filter(
            Utilisateur.email == data.email,
            Utilisateur.id_user != user_id,
        ).first()
        if doublon:
            raise HTTPException(status_code=400, detail="Cet email est déjà utilisé.")
        user.email = data.email
    if data.mot_de_passe is not None:
        user.mot_de_passe = get_password_hash(data.mot_de_passe)

    # Champs réservés ADMIN
    if data.role is not None:
        exiger_admin(current_user)
        user.role = data.role
    if data.actif is not None:
        exiger_admin(current_user)
        user.actif = data.actif

    db.commit()
    db.refresh(user)
    return user


# ============================================================
# SUPPRESSION  (ADMIN uniquement)
# ============================================================

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_utilisateur(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user),
):
    """
    Supprime un utilisateur.
    Réservé : ADMIN uniquement.
    Un ADMIN ne peut pas se supprimer lui-même.
    """
    exiger_admin(current_user)

    if current_user.id_user == user_id:
        raise HTTPException(
            status_code=400,
            detail="Vous ne pouvez pas supprimer votre propre compte."
        )

    user = db.query(Utilisateur).filter(Utilisateur.id_user == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé.")

    db.delete(user)
    db.commit()