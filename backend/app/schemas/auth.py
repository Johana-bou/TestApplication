# app/schemas/auth.py
from pydantic import BaseModel
from typing import Optional

# --- Requêtes ---
class PosteChoice(BaseModel):
    code_poste: str

class LoginRequest(BaseModel):
    code_poste: str
    pseudo: str
    mot_de_passe: str

# --- Réponses ---
class PosteResponse(BaseModel):
    id: int
    code_poste: str
    nom_poste: str
    adresse: Optional[str] = None

    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: int
    pseudo: str
    nom_complet: str
    role: str

    class Config:
        from_attributes = True

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    poste: PosteResponse