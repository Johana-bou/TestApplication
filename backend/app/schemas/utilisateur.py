# app/schemas/utilisateur.py
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime

ROLES_VALIDES = {"ADMIN", "RECEVEUR"}


class UtilisateurCreate(BaseModel):
    nom:          str            = Field(..., min_length=2, max_length=50)
    prenom:       str            = Field(..., min_length=2, max_length=50)
    pseudo:       str            = Field(..., min_length=3, max_length=50)
    mot_de_passe: str            = Field(..., min_length=4)
    email:        Optional[EmailStr] = None
    role:         str            = "RECEVEUR"   
    poste_id:     int

    @field_validator("role")
    @classmethod
    def valider_role(cls, v: str) -> str:
        v = v.upper().strip()
        if v not in ROLES_VALIDES:
            raise ValueError(f"Rôle invalide '{v}'. Valeurs acceptées : {ROLES_VALIDES}")
        return v


class UtilisateurUpdate(BaseModel):
    nom:          Optional[str]       = None
    prenom:       Optional[str]       = None
    email:        Optional[EmailStr]  = None
    role:         Optional[str]       = None
    actif:        Optional[bool]      = None
    mot_de_passe: Optional[str]       = None

    @field_validator("role")
    @classmethod
    def valider_role(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.upper().strip()
        if v not in ROLES_VALIDES:
            raise ValueError(f"Rôle invalide '{v}'. Valeurs acceptées : {ROLES_VALIDES}")
        return v


class UtilisateurResponse(BaseModel):
    id_user:    int
    nom:        str
    prenom:     str
    pseudo:     str
    email:      Optional[str] = None
    role:       str
    actif:      bool
    poste_id:   int
    created_at: datetime

    class Config:
        from_attributes = True

    @property
    def nom_complet(self) -> str:
        return f"{self.nom} {self.prenom}"