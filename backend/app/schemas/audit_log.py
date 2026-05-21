# app/schemas/audit_log.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AuditLogResponse(BaseModel):
    id_log: int
    id_user: Optional[int] = None
    action: str
    table_concernee: str
    valeur_avant: Optional[str] = None
    valeur_apres: Optional[str] = None
    ip_address: Optional[str] = None
    date_action: datetime

    class Config:
        from_attributes = True