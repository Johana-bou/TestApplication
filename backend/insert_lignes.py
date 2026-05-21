from app.database import SessionLocal
from app.models import LigneBudgetaire

# Définir l'id_poste souhaité (1 pour MAROUA, 2 pour LIMANI)
ID_POSTE_DEFAUT = 1 

lignes = [
    ("71412", "TVA À L'IMPORTATION", "TVA"),
    ("71422", "DROIT D'ACCISES À L'ENTRÉE DOUANE", "DAC"),
    ("71513", "REDEVENCE INFORMATIQUE BUDGET IMPORT", "RII"),
    ("4752120", "PROTOCOLE DOUANE / CAD", "PROTOCOLE"),
    ("71516", "DROIT DE DOUANE À L'IMPORTATION", "DDI"),
    ("71595", "PRELEVEMENT OHADA", "PRO"),
    ("4752802", "APPUI AU RECOUVREMENT (CAC DOUANES)", "CAC"),
]

db = SessionLocal()
for num, intitule, code in lignes:
    existing = db.query(LigneBudgetaire).filter(LigneBudgetaire.num_ligne == num).first()
    if not existing:
        ligne = LigneBudgetaire(
            id_poste=ID_POSTE_DEFAUT,
            num_ligne=num,
            intitule=intitule,
            code_taxe=code
        )
        db.add(ligne)
        print(f'Ajout : {num} - {intitule}')
    else:
        print(f'Déjà présent : {num}')
db.commit()
db.close()
print('Insertion terminée.')