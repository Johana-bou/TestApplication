# app/models/audit_log.py
"""
Modèle AuditLog - SQLite avec clés étrangères
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class AuditLog(Base):
    """Journal des actions utilisateurs"""
    __tablename__ = "audit_logs"
    
    id_log = Column(Integer, primary_key=True, index=True, comment="Identifiant unique")
    id_user = Column(Integer, ForeignKey("utilisateurs.id_user", ondelete="SET NULL"), nullable=True, comment="Utilisateur")
    
    action = Column(String(100), nullable=False, comment="Action (CREATE, UPDATE, DELETE, LOGIN)")
    table_concernee = Column(String(50), nullable=False, comment="Table concernée")
    valeur_avant = Column(Text, nullable=True, comment="Valeur avant modification")
    valeur_apres = Column(Text, nullable=True, comment="Valeur après modification")
    ip_address = Column(String(45), nullable=True, comment="Adresse IP")
    date_action = Column(DateTime, default=datetime.utcnow, nullable=False, comment="Date de l'action")
    
    # Relations
    utilisateur = relationship("Utilisateur", back_populates="audit_logs")
    
    def __repr__(self):
        return f"<AuditLog {self.action} - {self.table_concernee}>"