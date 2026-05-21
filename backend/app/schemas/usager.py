# app/schemas/usager.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UsagerCreate(BaseModel):
    nom_usager: str
    raison_sociale: Optional[str] = None
    telephone: Optional[str] = None
    id_compte: int

class UsagerUpdate(BaseModel):
    nom_usager: Optional[str] = None
    raison_sociale: Optional[str] = None
    telephone: Optional[str] = None

class UsagerResponse(BaseModel):
    id_usager: int
    nom_usager: str
    raison_sociale: Optional[str] = None
    telephone: Optional[str] = None
    id_compte: int
    created_at: datetime

    class Config:
        from_attributes = True