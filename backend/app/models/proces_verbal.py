from sqlalchemy import Column, Integer, String, Date, DateTime, Text, Float, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class ProcesVerbal(Base):
    __tablename__ = "proces_verbaux"

    id_pv   = Column(Integer, primary_key=True, index=True)
    id_user = Column(Integer, ForeignKey("utilisateurs.id_user", ondelete="RESTRICT"), nullable=False)
    id_poste= Column(Integer, ForeignKey("postes.id_poste",      ondelete="RESTRICT"), nullable=False)

    # ← nullable=True le temps du flush() pour récupérer id_pv avant de générer num_pv
    num_pv  = Column(String(50), unique=True, nullable=True, index=True)

    date_pv               = Column(Date, nullable=False)
    date_dernier_controle = Column(Date, nullable=False)
    date_debut_periode    = Column(Date, nullable=False)
    date_fin_periode      = Column(Date, nullable=False)

    solde_dernier_controle = Column(Float, default=0.0)
    mouvements_debiteurs   = Column(Float, default=0.0)
    mouvements_crediteurs  = Column(Float, default=0.0)
    solde_theorique        = Column(Float, default=0.0)
    difference             = Column(Float, default=0.0)

    observation   = Column(Text,     nullable=True)
    date_creation = Column(DateTime, default=datetime.utcnow)

    utilisateur = relationship("Utilisateur",      back_populates="proces_verbaux")
    poste       = relationship("Poste",            back_populates="proces_verbaux")
    virements   = relationship("SituationVirement",back_populates="pv", cascade="all, delete-orphan")
    cheques     = relationship("SituationCheque",  back_populates="pv", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ProcesVerbal {self.num_pv}>"