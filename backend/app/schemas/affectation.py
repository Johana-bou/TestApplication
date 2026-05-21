# app/schemas/affectation.py
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class AffectationCreate(BaseModel):
    id_user: int
    id_poste: int
    date_debut: Optional[date] = None
    date_fin: Optional[date] = None

class AffectationUpdate(BaseModel):
    date_fin: Optional[date] = None

class AffectationResponse(BaseModel):
    id_affectation: int
    id_user: int
    id_poste: int
    date_debut: date
    date_fin: Optional[date] = None
    created_at: datetime

    class Config:
        from_attributes = True