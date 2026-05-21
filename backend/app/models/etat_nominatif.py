# app/models/etat_nominatif.py
from sqlalchemy import Column, Integer, String, Date, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class EtatNominatif(Base):
    __tablename__ = "etats_nominatifs"
    
    id_etat = Column(Integer, primary_key=True, index=True)
    id_user = Column(Integer, ForeignKey("utilisateurs.id_user"), nullable=False)
    date_etat = Column(Date, nullable=False)
    observation = Column(Text, nullable=True)
    type = Column(String(20), nullable=False, default="RAR")          
    id_compte = Column(Integer, ForeignKey("comptes.id_compte"), nullable=True) 
    date_creation = Column(DateTime, default=datetime.utcnow)
    
    # Relations
    utilisateur = relationship("Utilisateur", back_populates="etats_nominatifs")
    lignes = relationship("LigneNominatif", back_populates="etat", cascade="all, delete-orphan")
    compte = relationship("Compte")   