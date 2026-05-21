# app/models/utilisateur.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Utilisateur(Base):
    """Utilisateur du système (agent douanier)"""
    __tablename__ = "utilisateurs"
    
    id_user = Column(Integer, primary_key=True, index=True, comment="Identifiant unique")
    nom = Column(String(50), nullable=False, comment="Nom de l'agent")
    prenom = Column(String(50), nullable=False, comment="Prénom de l'agent")
    email = Column(String(100), nullable=True, comment="Email professionnel")
    pseudo = Column(String(50), unique=True, nullable=False, index=True, comment="Nom d'utilisateur")
    mot_de_passe = Column(String(255), nullable=False, comment="Mot de passe hashé")
    role = Column(String(20), default="RECEVEUR", comment="Rôle: ADMIN, RECEVEUR")
    actif = Column(Boolean, default=True, comment="Compte actif ou désactivé")
    poste_id = Column(Integer, ForeignKey("postes.id_poste", ondelete="RESTRICT"), nullable=False, comment="Poste d'affectation")
    created_at = Column(DateTime, default=datetime.utcnow, comment="Date de création")
    
    # Relations
    poste = relationship("Poste", foreign_keys=[poste_id])
    affectations = relationship("Affectation", back_populates="utilisateur", cascade="all, delete-orphan")
    proces_verbaux = relationship("ProcesVerbal", back_populates="utilisateur")
    etats_nominatifs = relationship("EtatNominatif", back_populates="utilisateur")
    etats_rapprochement = relationship("EtatRapprochement", back_populates="utilisateur")
    audit_logs = relationship("AuditLog", back_populates="utilisateur")
    notifications = relationship("Notification", back_populates="utilisateur")
    encaissements = relationship("EtatEncaissement", back_populates="utilisateur")
    
    @property
    def nom_complet(self):
        return f"{self.nom} {self.prenom}"
    
    def __repr__(self):
        return f"<Utilisateur {self.pseudo} ({self.role})>"