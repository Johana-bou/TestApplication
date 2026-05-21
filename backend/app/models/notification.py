# app/models/notification.py
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Notification(Base):
    """Notifications utilisateurs"""
    __tablename__ = "notifications"
    
    id_notif = Column(Integer, primary_key=True, index=True, comment="Identifiant unique")
    id_user = Column(Integer, ForeignKey("utilisateurs.id_user", ondelete="CASCADE"), nullable=False, comment="Utilisateur destinataire")
    
    type = Column(String(50), nullable=False, comment="Type: INFO, WARNING, SUCCESS")
    message = Column(String(500), nullable=False, comment="Message")
    lu = Column(Boolean, default=False, comment="Notification lue")
    date_notif = Column(DateTime, default=datetime.utcnow, nullable=False, comment="Date de création")
    
    # Relations
    utilisateur = relationship("Utilisateur", back_populates="notifications")
    
    def __repr__(self):
        return f"<Notification {self.type}>"