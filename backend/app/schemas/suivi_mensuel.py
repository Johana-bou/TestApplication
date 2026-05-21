# app/schemas/suivi_mensuel.py
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class SuiviUniteCreate(BaseModel):
    id_unite: int
    montant: float = 0.0

class SuiviUniteResponse(BaseModel):
    id_suivi_unite: int
    id_unite: int
    montant: float

    class Config:
        from_attributes = True

class SuiviMensuelCreate(BaseModel):
    type: str = Field(..., pattern="^(CAC|protocole)$")
    annee: int = Field(..., ge=2000, le=2100)
    mois: int = Field(..., ge=1, le=12)
    periodicite: str = "mensuel"
    unites: List[SuiviUniteCreate] = []

class SuiviMensuelUpdate(BaseModel):
    periodicite: Optional[str] = None

class SuiviMensuelResponse(BaseModel):
    id_suivi: int
    id_user: int
    type: str
    annee: int
    mois: int
    periodicite: str
    date_creation: datetime

    class Config:
        from_attributes = True

class SuiviMensuelDetailResponse(SuiviMensuelResponse):
    unites_suivies: List[SuiviUniteResponse] = []