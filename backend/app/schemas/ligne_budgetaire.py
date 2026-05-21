# app/schemas/ligne_budgetaire.py
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class LigneBudgetaireBase(BaseModel):
    num_ligne: str
    intitule: str
    code_taxe: str

class LigneBudgetaireCreate(LigneBudgetaireBase):
    pass   # plus d'id_poste

class LigneBudgetaireResponse(LigneBudgetaireBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class LigneBudgetaireVerifyResponse(BaseModel):
    """Réponse quand l'agent saisit un num_ligne — affiche code_taxe et intitulé"""
    id: int
    num_ligne: str
    intitule: str
    code_taxe: str

    class Config:
        from_attributes = True

class LigneBudgetaireBulkCreate(BaseModel):
    lignes: List[LigneBudgetaireBase]  