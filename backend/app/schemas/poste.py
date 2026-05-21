# app/schemas/poste.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PosteCreate(BaseModel):
    code_poste: str
    nom_poste: str
    adresse: Optional[str] = None

class PosteUpdate(BaseModel):
    nom_poste: Optional[str] = None
    adresse: Optional[str] = None

class PosteResponse(BaseModel):
    id: int
    code_poste: str
    nom_poste: str
    adresse: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True