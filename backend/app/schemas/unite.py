from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UniteCreate(BaseModel):
    nom_unite : str
    id_poste  : int

class UniteUpdate(BaseModel):
    nom_unite : Optional[str] = None

class UniteResponse(BaseModel):
    id_unite  : int
    nom_unite : str
    id_poste  : int
    created_at: datetime

    class Config:
        from_attributes = True