# app/models/poste.py
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Poste(Base):
    """Poste douanier (Maroua, Limani)"""
    __tablename__ = "postes"
    
    id_poste = Column(Integer, primary_key=True, index=True, comment="Identifiant unique")
    code_poste = Column(String(10), unique=True, nullable=False, index=True, comment="Code du poste (488, 490)")
    nom_poste = Column(String(150), nullable=False, comment="Nom officiel complet")
    adresse = Column(String(200), nullable=True, comment="Adresse physique")
    created_at = Column(DateTime, default=datetime.utcnow, comment="Date de création")
    
    # Relations
    comptes = relationship("Compte", back_populates="poste", cascade="all, delete-orphan")
    affectations = relationship("Affectation", back_populates="poste", cascade="all, delete-orphan")
    unites = relationship("Unite", back_populates="poste", cascade="all, delete-orphan")
    config_impressions = relationship("ConfigImpression", back_populates="poste", cascade="all, delete-orphan")
    proces_verbaux = relationship("ProcesVerbal", back_populates="poste")
    
    def __repr__(self):
        return f"<Poste {self.code_poste} - {self.nom_poste}>"