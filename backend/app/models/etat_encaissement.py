from sqlalchemy import Column, Integer, Date, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class EtatEncaissement(Base):
    __tablename__ = "etats_encaissement"

    id_encaissement   = Column(Integer, primary_key=True, index=True)
    id_unite          = Column(Integer, ForeignKey("unites.id_unite",
                                ondelete="RESTRICT"), nullable=False)
    id_ligne          = Column(Integer, ForeignKey("lignes_budgetaires.id",
                                ondelete="RESTRICT"), nullable=False)
    id_user           = Column(Integer, ForeignKey("utilisateurs.id_user"),
                                nullable=False)
    date_encaissement = Column(Date, nullable=False)
    mois              = Column(Integer, nullable=False)
    annee             = Column(Integer, nullable=False)
    montant           = Column(Float, nullable=False)
    date_creation     = Column(DateTime, default=datetime.utcnow)

    # Relations
    unite = relationship("Unite", back_populates="encaissements")
    ligne = relationship("LigneBudgetaire", back_populates="encaissements")
    utilisateur      = relationship("Utilisateur")

    def __repr__(self):
        return f"<EtatEncaissement {self.id_encaissement}>"