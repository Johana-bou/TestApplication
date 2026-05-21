from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime


# ─── Virement ────────────────────────────────────────────────────────────────

class VirementCreate(BaseModel):
    date_virement : date
    num_virement  : str   = Field(..., max_length=50)
    montant       : float = Field(..., ge=0)
    observation   : Optional[str] = None

class VirementResponse(BaseModel):
    id_virement   : int
    id_pv         : int
    date_virement : date
    num_virement  : str
    montant       : float
    observation   : Optional[str] = None

    class Config:
        from_attributes = True


# ─── Chèque ──────────────────────────────────────────────────────────────────

class ChequeCreate(BaseModel):
    date_cheque : date
    num_cheque  : str   = Field(..., max_length=50)
    montant     : float = Field(..., ge=0)
    num_dr      : Optional[str] = None
    observation : Optional[str] = None

class ChequeResponse(BaseModel):
    id_cheque   : int
    id_pv       : int
    date_cheque : date
    num_cheque  : str
    montant     : float
    num_dr      : Optional[str] = None
    observation : Optional[str] = None

    class Config:
        from_attributes = True


# ─── Procès-Verbal ───────────────────────────────────────────────────────────

class PVCreate(BaseModel):
    # ← num_pv supprimé — généré automatiquement par le backend
    date_pv                : date
    poste_id               : int
    solde_dernier_controle : float = 0.0
    mouvements_debiteurs   : float = 0.0
    mouvements_crediteurs  : float = 0.0
    observation            : Optional[str] = None
    virements              : List[VirementCreate] = []
    cheques                : List[ChequeCreate]   = []

class PVUpdate(BaseModel):
    observation : Optional[str] = None

class PVResponse(BaseModel):
    id_pv                  : int
    num_pv                 : str        # ← toujours retourné
    date_pv                : date
    date_dernier_controle  : date
    date_debut_periode     : date
    date_fin_periode       : date
    id_poste               : int
    id_user                : int
    solde_dernier_controle : float
    mouvements_debiteurs   : float
    mouvements_crediteurs  : float
    solde_theorique        : float
    difference             : float
    observation            : Optional[str] = None
    date_creation          : datetime

    class Config:
        from_attributes = True

class PVDetailResponse(PVResponse):
    virements : List[VirementResponse] = []
    cheques   : List[ChequeResponse]   = []


# ─── Bulk ────────────────────────────────────────────────────────────────────

class VirementBulkCreate(BaseModel):
    date_virement : date
    num_virement  : str
    montant       : float
    observation   : Optional[str] = None

class VirementsBulkCreate(BaseModel):
    virements: List[VirementBulkCreate]

class ChequeBulkCreate(BaseModel):
    date_cheque : date
    num_cheque  : str
    montant     : float
    num_dr      : Optional[str] = None
    observation : Optional[str] = None

class ChequesBulkCreate(BaseModel):
    cheques: List[ChequeBulkCreate]