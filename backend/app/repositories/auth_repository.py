from sqlalchemy.orm import Session
from typing import Optional, List
from app.models.poste import Poste
from app.models.utilisateur import Utilisateur

class AuthRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all_postes(self) -> List[Poste]:
        return self.db.query(Poste).all()

    def get_poste_by_code(self, code_poste: str) -> Optional[Poste]:
        return self.db.query(Poste)\
            .filter(Poste.code_poste == code_poste)\
            .first()

    def get_utilisateur_by_pseudo_and_poste(
        self,
        pseudo: str,
        poste_id: int
    ) -> Optional[Utilisateur]:
        return self.db.query(Utilisateur)\
            .filter(
                Utilisateur.pseudo == pseudo,
                Utilisateur.poste_id == poste_id
            ).first()
