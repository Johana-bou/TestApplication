from sqlalchemy import Column, Integer, String, Date, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class SituationCheque(Base):
    """Détail des chèques dans un PV"""
    __tablename__ = "situation_cheques"
    
    id_cheque = Column(Integer, primary_key=True, index=True)
    id_pv = Column(Integer, ForeignKey("proces_verbaux.id_pv", ondelete="CASCADE"), nullable=False)
    date_cheque = Column(Date, nullable=False)
    num_cheque = Column(String(50), nullable=False)
    num_dr = Column(String(50), nullable=True)
    montant = Column(Float, nullable=False)
    observation = Column(String(200), nullable=True)
    
    pv = relationship("ProcesVerbal", back_populates="cheques")
    
    def __repr__(self):
        return f"<SituationCheque {self.num_cheque}>"
