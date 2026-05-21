# app/models/etat_rapprochement.py
"""
Modèle EtatRapprochement - SQLite avec clés étrangères
"""
from sqlalchemy import Column, Integer, String, Date, DateTime, Text, Float, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class EtatRapprochement(Base):
    """État de rapprochement bancaire"""
    __tablename__ = "etats_rapprochement"
    
    id_rapprochement = Column(Integer, primary_key=True, index=True, comment="Identifiant unique")
    id_compte = Column(Integer, ForeignKey("comptes.id_compte", ondelete="RESTRICT"), nullable=False, comment="Compte concerné")
    id_user = Column(Integer, ForeignKey("utilisateurs.id_user", ondelete="RESTRICT"), nullable=False, comment="Agent créateur")
    
    intitule = Column(String(200), nullable=False, comment="Intitulé")
    solde_balance = Column(Float, default=0.0, comment="Solde balance")
    operation_acct_non_constate = Column(Float, default=0.0, comment="Opérations ACCT non constatées")
    operation_poste_non_constate = Column(Float, default=0.0, comment="Opérations poste non constatées")
    solde_theorique = Column(Float, default=0.0, comment="Solde théorique")
    ecart = Column(Float, default=0.0, comment="Écart")
    observation = Column(Text, nullable=True, comment="Observations")
    date_rapprochement = Column(Date, nullable=False, comment="Date du rapprochement")
    date_creation = Column(DateTime, default=datetime.utcnow, comment="Date de création")
    
    # Relations
    compte = relationship("Compte", back_populates="etats_rapprochement")
    utilisateur = relationship("Utilisateur", back_populates="etats_rapprochement")
    
    def __repr__(self):
        return f"<EtatRapprochement {self.intitule}>"