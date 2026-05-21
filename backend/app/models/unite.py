from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Unite(Base):
    __tablename__ = "unites"

    id_unite   = Column(Integer, primary_key=True, index=True)
    id_poste = Column(Integer, ForeignKey("postes.id_poste"))
    nom_unite  = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relations
    poste              = relationship("Poste", back_populates="unites")
    encaissements = relationship("EtatEncaissement", back_populates="unite",
                                      cascade="all, delete-orphan")
    


    def __repr__(self):
        return f"<Unite {self.nom_unite}>"