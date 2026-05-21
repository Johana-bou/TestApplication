from sqlalchemy.orm import Session
from typing import Optional, List
from app.models.compte import Compte
from app.repositories.base import BaseRepository

class CompteRepository(BaseRepository[Compte]):
    def __init__(self, db: Session):
        super().__init__(Compte, db)

    def get_by_num_compte(self, num_compte: str) -> Optional[Compte]:
        return self.db.query(Compte)\
            .filter(Compte.num_compte == num_compte)\
            .first()

    def get_by_poste(self, poste_id: int) -> List[Compte]:
        return self.db.query(Compte)\
            .filter(Compte.poste_id == poste_id)\
            .all()