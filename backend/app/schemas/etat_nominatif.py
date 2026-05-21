# app/schemas/etat_nominatif.py
from enum import Enum
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

# ========== ENUM POUR LE TYPE ==========
class TypeEtat(str, Enum):
    RAR    = "RAR"
    AMENDE = "AMENDE"

class LigneNominatifCreate(BaseModel):
    id_usager            : int
    libelle              : str
    montant_rar_physique : float = 0.0
    montant_rar_balance  : float = 0.0

class LigneNominatifResponse(BaseModel):
    id_ligne             : int
    id_usager            : int
    libelle              : str
    montant_rar_physique : float
    montant_rar_balance  : float
    ecart                : float
    class Config:
        from_attributes = True

class EtatNominatifCreate(BaseModel):
    date_etat   : Optional[date] = None
    observation : Optional[str]  = None
    type        : TypeEtat       = TypeEtat.RAR
    id_compte   : Optional[int]  = None
    lignes      : List[LigneNominatifCreate] = []

class EtatNominatifUpdate(BaseModel):
    observation : Optional[str] = None
    date_etat   : Optional[date] = None

class EtatNominatifResponse(BaseModel):
    id_etat        : int
    id_user        : int
    date_etat      : date
    observation    : Optional[str]   = None
    type           : TypeEtat        = TypeEtat.RAR
    id_compte      : Optional[int]   = None
    date_creation  : datetime
    # ── Champs calculés depuis les lignes ──
    nombre_lignes  : int             = 0
    total_physique : float           = 0.0
    total_balance  : float           = 0.0
    total_ecart    : float           = 0.0
    createur       : Optional[str]   = None

    class Config:
        from_attributes = True

class EtatNominatifDetailResponse(EtatNominatifResponse):
    lignes: List[LigneNominatifResponse] = []

class UsagerDisponibleResponse(BaseModel):
    id_usager      : int
    nom_usager     : str
    raison_sociale : Optional[str] = None
    compte_numero  : str
    compte_nom     : str
    telephone      : Optional[str] = None
    class Config:
        from_attributes = True