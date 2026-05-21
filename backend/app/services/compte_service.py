from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.repositories.compte_repository import CompteRepository
from app.schemas.compte import CompteCreate, CompteUpdate
from app.models.compte import Compte

class CompteService:
    def __init__(self, db: Session):
        self.repo = CompteRepository(db)

    def get_all(self):
        return self.repo.get_all()

    def get_by_poste(self, poste_id: int):
        return self.repo.get_by_poste(poste_id)

    def creer_compte(self, data: CompteCreate) -> Compte:
        if self.repo.get_by_num_compte(data.num_compte):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Le compte {data.num_compte} existe deja")
        compte = Compte(**data.model_dump())
        return self.repo.create(compte)

    def modifier_compte(self, compte_id: int, data: CompteUpdate) -> Compte:
        compte = self.repo.get_by_id(compte_id)
        if not compte:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compte non trouve")
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(compte, field, value)
        return self.repo.update(compte)

    def supprimer_compte(self, compte_id: int):
        if not self.repo.delete(compte_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compte non trouve")
