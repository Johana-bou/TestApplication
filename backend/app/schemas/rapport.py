# app/schemas/rapport.py
from pydantic import BaseModel
from typing import Dict, Optional
from datetime import date

class RapportLigneUnite(BaseModel):
    id_unite: int
    nom_unite: str
    montants_par_mois: Dict[int, float]   # clé = numéro de mois (1-12)
    total: float

class RapportResponse(BaseModel):
    type_rapport: str   # "PROTOCOLE" ou "CAC"
    date_debut: date
    date_fin: date
    unites: list[RapportLigneUnite]