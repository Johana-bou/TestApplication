# app/schemas/etat_rapprochement.py
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class EtatRapprochementCreate(BaseModel):
    id_compte: int
    intitule: str
    solde_balance: float = 0.0
    operation_acct_non_constate: float = 0.0
    operation_poste_non_constate: float = 0.0
    observation: Optional[str] = None
    date_rapprochement: Optional[date] = None

class EtatRapprochementUpdate(BaseModel):
    intitule: Optional[str] = None
    solde_balance: Optional[float] = None
    operation_acct_non_constate: Optional[float] = None
    operation_poste_non_constate: Optional[float] = None
    observation: Optional[str] = None

class EtatRapprochementResponse(BaseModel):
    id_rapprochement: int
    id_compte: int
    id_user: int
    intitule: str
    solde_balance: float
    operation_acct_non_constate: float
    operation_poste_non_constate: float
    solde_theorique: float
    ecart: float
    observation: Optional[str] = None
    date_rapprochement: date
    date_creation: datetime

    class Config:
        from_attributes = True