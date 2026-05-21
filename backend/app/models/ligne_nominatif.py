# app/models/ligne_nominatif.py
from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class LigneNominatif(Base):
    __tablename__ = "lignes_nominatifs"
    
    id_ligne = Column(Integer, primary_key=True, index=True)
    id_etat = Column(Integer, ForeignKey("etats_nominatifs.id_etat"), nullable=False)  # ← id_etat
    id_usager = Column(Integer, ForeignKey("usagers.id_usager"), nullable=False)  # ← id_usager
    libelle = Column(String(200), nullable=False)
    montant_rar_physique = Column(Float, default=0.0)
    montant_rar_balance = Column(Float, default=0.0)
    
    # Relations
    etat = relationship("EtatNominatif", back_populates="lignes")
    usager = relationship("Usager", back_populates="lignes_nominatif")
    
    @property
    def ecart(self):
        return (self.montant_rar_physique or 0) - (self.montant_rar_balance or 0)