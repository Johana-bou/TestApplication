from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.repositories.utilisateur_repository import UtilisateurRepository
from app.schemas.utilisateur import UtilisateurCreate, UtilisateurUpdate
from app.models.utilisateur import Utilisateur
from app.security.jwt import get_password_hash

class UtilisateurService:
    def __init__(self, db: Session):
        self.repo = UtilisateurRepository(db)

    def get_all(self):
        return self.repo.get_all()

    def get_by_id(self, user_id: int) -> Utilisateur:
        user = self.repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur non trouve")
        return user

    def get_by_poste(self, poste_id: int):
        return self.repo.get_by_poste(poste_id)

    def creer_utilisateur(self, data: UtilisateurCreate) -> Utilisateur:
        if self.repo.get_by_pseudo(data.pseudo):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Le pseudo {data.pseudo} est deja pris")
        data_dict = data.model_dump()
        data_dict["mot_de_passe"] = get_password_hash(data_dict["mot_de_passe"])
        user = Utilisateur(**data_dict)
        return self.repo.create(user)

    def modifier_utilisateur(self, user_id: int, data: UtilisateurUpdate) -> Utilisateur:
        user = self.get_by_id(user_id)
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(user, field, value)
        return self.repo.update(user)

    def supprimer_utilisateur(self, user_id: int):
        if not self.repo.delete(user_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur non trouve")
