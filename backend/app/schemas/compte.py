# app/schemas/compte.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CompteCreate(BaseModel):
    num_compte: str
    intitule: str
    poste_id: Optional[int] = None

class CompteUpdate(BaseModel):
    intitule: Optional[str] = None
    poste_id: Optional[int] = None

class CompteResponse(BaseModel):
    id: int
    num_compte: str
    intitule: str
    poste_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True