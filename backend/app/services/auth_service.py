from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.repositories.auth_repository import AuthRepository
from app.schemas.auth import LoginRequest
from app.security.jwt import verify_password, create_access_token

class AuthService:
    def __init__(self, db: Session):
        self.repo = AuthRepository(db)

    def get_all_postes(self):
        return self.repo.get_all_postes()

    def verify_poste(self, code_poste: str):
        poste = self.repo.get_poste_by_code(code_poste)
        if not poste:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Code poste invalide")
        return poste

    def login(self, request: LoginRequest) -> dict:
        poste = self.repo.get_poste_by_code(request.code_poste)
        if not poste:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Code poste invalide")
        user = self.repo.get_utilisateur_by_pseudo_and_poste(pseudo=request.pseudo, poste_id=poste.id)
        if not user or not verify_password(request.mot_de_passe, user.mot_de_passe):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Pseudo ou mot de passe incorrect")
        if not user.actif:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Compte desactive")
        access_token = create_access_token(data={"sub": user.id, "poste_id": poste.id, "pseudo": user.pseudo, "role": user.role})
        return {
            "access_token": access_token,
            "user": {"id": user.id, "pseudo": user.pseudo, "nom_complet": user.nom_complet, "role": user.role},
            "poste": {"id": poste.id, "code_poste": poste.code_poste, "nom_poste": poste.nom_poste}
        }
