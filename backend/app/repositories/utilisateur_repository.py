from sqlalchemy.orm import Session
from typing import Optional, List
from app.models.utilisateur import Utilisateur
from app.repositories.base import BaseRepository

class UtilisateurRepository(BaseRepository[Utilisateur]):
    def __init__(self, db: Session):
        super().__init__(Utilisateur, db)

    def get_by_pseudo(self, pseudo: str) -> Optional[Utilisateur]:
        return self.db.query(Utilisateur)\
            .filter(Utilisateur.pseudo == pseudo)\
            .first()

    def get_by_poste(self, poste_id: int) -> List[Utilisateur]:
        return self.db.query(Utilisateur)\
            .filter(Utilisateur.poste_id == poste_id)\
            .all()

    def get_by_pseudo_and_poste(self, pseudo: str, poste_id: int) -> Optional[Utilisateur]:
        return self.db.query(Utilisateur)\
            .filter(
                Utilisateur.pseudo == pseudo,
                Utilisateur.poste_id == poste_id
            ).first()