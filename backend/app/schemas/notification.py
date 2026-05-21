# app/schemas/notification.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NotificationCreate(BaseModel):
    id_user: int
    type: str = "INFO"
    message: str

class NotificationUpdate(BaseModel):
    lu: Optional[bool] = None

class NotificationResponse(BaseModel):
    id_notif: int
    id_user: int
    type: str
    message: str
    lu: bool
    date_notif: datetime

    class Config:
        from_attributes = True