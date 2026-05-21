# app/models/affectation.py
"""
Modèle Affectation - SQLite avec clés étrangères
"""
from sqlalchemy import Column, Integer, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, date
from app.database import Base


class Affectation(Base):
    """Affectation d'un utilisateur à un poste sur une période"""
    __tablename__ = "affectations"
    
    id_affectation = Column(Integer, primary_key=True, index=True, comment="Identifiant unique")
    id_user = Column(Integer, ForeignKey("utilisateurs.id_user", ondelete="CASCADE"), nullable=False, comment="Utilisateur")
    id_poste = Column(Integer, ForeignKey("postes.id_poste", ondelete="CASCADE"), nullable=False, comment="Poste")
    date_debut = Column(Date, nullable=False, default=date.today, comment="Date début affectation")
    date_fin = Column(Date, nullable=True, comment="Date fin affectation (NULL = en cours)")
    created_at = Column(DateTime, default=datetime.utcnow, comment="Date de création")
    
    # Relations
    utilisateur = relationship("Utilisateur", back_populates="affectations")
    poste = relationship("Poste", back_populates="affectations")
    
    def __repr__(self):
        return f"<Affectation User:{self.id_user} Poste:{self.id_poste}>"