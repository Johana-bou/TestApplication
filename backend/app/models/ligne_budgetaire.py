from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class LigneBudgetaire(Base):
    __tablename__ = "lignes_budgetaires"

    id = Column(Integer, primary_key=True, index=True)
    num_ligne = Column(String(50), unique=True, nullable=False, index=True)
    intitule = Column(String(200), nullable=False)
    code_taxe = Column(String(20), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    encaissements = relationship("EtatEncaissement", back_populates="ligne")