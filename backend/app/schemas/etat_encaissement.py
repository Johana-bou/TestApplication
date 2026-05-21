# app/schemas/etat_encaissement.py
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class EtatEncaissementBase(BaseModel):
    id_unite          : int
    num_ligne         : str
    date_encaissement : date
    montant           : float

class EtatEncaissementCreate(EtatEncaissementBase):
    pass

class EtatEncaissementUpdate(BaseModel):
    num_ligne         : Optional[str]   = None
    date_encaissement : Optional[date]  = None
    montant           : Optional[float] = None

class EtatEncaissementResponse(EtatEncaissementBase):
    id_encaissement   : int
    intitule          : str
    code_taxe         : str
    mois              : int
    annee             : int
    date_creation     : datetime

    class Config:
        from_attributes = True