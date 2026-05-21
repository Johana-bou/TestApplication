import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models import LigneBudgetaire
lignes = [
    ("71412", "TVA À L'IMPORTATION", "TVA"),
    ("71422", "DROIT D'ACCISES À L'ENTRÉE DOUANE ", "DAC"),
    ("71513", "REDEVENCE INFORMATIQUE BUDGET IMPORT", "RII"),
    ("4752120", "PROTOCOLE DOUANE / CAD", "PCT"),
    ("71516", "DROIT DE DOUANE À L'IMPORTATION", "DDI"),
    ("71595", "PRELEVEMENT OHADA", "PRO"),
    ("4752802", "APPUI AU RECOUVREMENT (CAC DOUANES)", "CAD"),
]

db = SessionLocal()
for num, intitule, code in lignes:
    # Vérifier si la ligne existe déjà
    existing = db.query(LigneBudgetaire).filter(LigneBudgetaire.num_ligne == num).first()
    if not existing:
        ligne = LigneBudgetaire(num_ligne=num, intitule=intitule, code_taxe=code)
        db.add(ligne)
        print(f"Ajout : {num} - {intitule}")
    else:
        print(f"Déjà présent : {num}")
db.commit()
db.close()
print("Insertion terminée.")