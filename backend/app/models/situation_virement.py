# app/models/situation_virement.py
from sqlalchemy import Column, Integer, String, Date, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class SituationVirement(Base):
    """Détail des virements dans un PV"""
    __tablename__ = "situation_virements"
    
    id_virement = Column(Integer, primary_key=True, index=True, comment="Identifiant unique")
    id_pv = Column(Integer, ForeignKey("proces_verbaux.id_pv", ondelete="CASCADE"), nullable=False, comment="PV parent")
    date_virement = Column(Date, nullable=False, comment="Date du virement")
    num_virement = Column(String(50), nullable=False, comment="Numéro du virement")
    montant = Column(Float, nullable=False, comment="Montant")
    observation = Column(String(200), nullable=True, comment="Observations")
    
    # Relations
    pv = relationship("ProcesVerbal", back_populates="virements")
    
    def __repr__(self):
        return f"<Virement {self.num_virement}>"