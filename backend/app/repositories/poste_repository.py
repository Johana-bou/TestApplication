from sqlalchemy.orm import Session
from typing import Optional
from app.models.poste import Poste
from app.repositories.base import BaseRepository

class PosteRepository(BaseRepository[Poste]):
    def __init__(self, db: Session):
        super().__init__(Poste, db)

    def get_by_code(self, code_poste: str) -> Optional[Poste]:
        return self.db.query(Poste)\
            .filter(Poste.code_poste == code_poste)\
            .first()