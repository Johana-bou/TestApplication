from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.repositories.poste_repository import PosteRepository
from app.schemas.poste import PosteCreate, PosteUpdate
from app.models.poste import Poste

class PosteService:
    def __init__(self, db: Session):
        self.repo = PosteRepository(db)

    def get_all(self):
        return self.repo.get_all()

    def get_by_id(self, poste_id: int) -> Poste:
        poste = self.repo.get_by_id(poste_id)
        if not poste:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Poste non trouve")
        return poste

    def creer_poste(self, data: PosteCreate) -> Poste:
        if self.repo.get_by_code(data.code_poste):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Le poste {data.code_poste} existe deja")
        poste = Poste(**data.model_dump())
        return self.repo.create(poste)

    def modifier_poste(self, poste_id: int, data: PosteUpdate) -> Poste:
        poste = self.get_by_id(poste_id)
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(poste, field, value)
        return self.repo.update(poste)

    def supprimer_poste(self, poste_id: int):
        if not self.repo.delete(poste_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Poste non trouve")
