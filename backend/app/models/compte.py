# app/models/compte.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Compte(Base):
    """Compte comptable lié à un poste"""
    __tablename__ = "comptes"
    
    id_compte = Column(Integer, primary_key=True, index=True, comment="Identifiant unique")
    id_poste = Column(Integer, ForeignKey("postes.id_poste", ondelete="CASCADE"), nullable=True, comment="Poste associé (NULL = compte général)")
    nom_compte = Column(String(200), nullable=False, comment="Libellé du compte")
    num_compte = Column(String(50), unique=True, nullable=False, index=True, comment="Numéro du compte")
    created_at = Column(DateTime, default=datetime.utcnow, comment="Date de création")
    
    # Relations
    poste = relationship("Poste", back_populates="comptes")
    usagers = relationship("Usager", back_populates="compte", cascade="all, delete-orphan")
    etats_rapprochement = relationship("EtatRapprochement", back_populates="compte", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Compte {self.num_compte} - {self.nom_compte}>"