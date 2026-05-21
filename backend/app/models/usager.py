# app/models/usager.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Usager(Base):
    """Usager (contribuable) associé à un compte"""
    __tablename__ = "usagers"
    
    id_usager = Column(Integer, primary_key=True, index=True, comment="Identifiant unique")
    id_compte = Column(Integer, ForeignKey("comptes.id_compte", ondelete="CASCADE"), nullable=False, comment="Compte associé")
    nom_usager = Column(String(100), nullable=False, comment="Nom de l'usager")
    raison_sociale = Column(String(200), nullable=True, comment="Raison sociale")
    telephone = Column(String(20), nullable=True, comment="Numéro de téléphone")
    created_at = Column(DateTime, default=datetime.utcnow, comment="Date de création")
    
    # Relations
    compte = relationship("Compte", back_populates="usagers")
    lignes_nominatif = relationship("LigneNominatif", back_populates="usager", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Usager {self.nom_usager}>"