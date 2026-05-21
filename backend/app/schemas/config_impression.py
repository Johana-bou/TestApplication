# app/schemas/config_impression.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ConfigImpressionCreate(BaseModel):
    id_poste: int
    logo_path: Optional[str] = None
    entete: Optional[str] = None
    pied_page: Optional[str] = None
    nom_receveur: Optional[str] = None
    grade_receveur: Optional[str] = None

class ConfigImpressionUpdate(BaseModel):
    logo_path: Optional[str] = None
    entete: Optional[str] = None
    pied_page: Optional[str] = None
    nom_receveur: Optional[str] = None
    grade_receveur: Optional[str] = None

class ConfigImpressionResponse(BaseModel):
    id_config: int
    id_poste: int
    logo_path: Optional[str] = None
    entete: Optional[str] = None
    pied_page: Optional[str] = None
    nom_receveur: Optional[str] = None
    grade_receveur: Optional[str] = None
    date_creation: datetime
    date_modification: datetime

    class Config:
        from_attributes = True