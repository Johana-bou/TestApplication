# app/models/config_impression.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class ConfigImpression(Base):
    """Configuration des impressions par poste"""
    __tablename__ = "config_impressions"
    
    id_config = Column(Integer, primary_key=True, index=True, comment="Identifiant unique")
    id_poste = Column(Integer, ForeignKey("postes.id_poste", ondelete="CASCADE"), nullable=False, comment="Poste concerné")
    
    logo_path = Column(String(500), nullable=True, comment="Chemin du logo")
    entete = Column(String(500), nullable=True, comment="En-tête personnalisé")
    pied_page = Column(String(500), nullable=True, comment="Pied de page")
    nom_receveur = Column(String(100), nullable=True, comment="Nom par défaut du receveur")
    grade_receveur = Column(String(50), nullable=True, comment="Grade par défaut")
    date_creation = Column(DateTime, default=datetime.utcnow, comment="Date de création")
    date_modification = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="Date de modification")
    
    # Relations
    poste = relationship("Poste", back_populates="config_impressions")
    
    def __repr__(self):
        return f"<ConfigImpression Poste:{self.id_poste}>"