# scripts/migrate_etats_encaissement.py
import sqlite3

DB_PATH = "/home/natha/.gestion-receveur/data.db"

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

try:
    # Supprimer et recréer directement — table vide donc rien à perdre
    cursor.execute("DROP TABLE IF EXISTS etats_encaissement")
    print("✅ Ancienne table supprimée")

    cursor.execute("""
        CREATE TABLE etats_encaissement (
            id_encaissement   INTEGER PRIMARY KEY AUTOINCREMENT,
            id_unite          INTEGER NOT NULL REFERENCES unites(id_unite),
            id_ligne          INTEGER NOT NULL REFERENCES lignes_budgetaires(id),
            utilisateur_id    INTEGER NOT NULL REFERENCES utilisateurs(id),
            date_encaissement DATE NOT NULL,
            mois              INTEGER NOT NULL,
            annee             INTEGER NOT NULL,
            montant           REAL NOT NULL,
            date_creation     DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    print("✅ Table etats_encaissement recréée avec la bonne structure")

    conn.commit()
    print("\n✅ Migration terminée avec succès")

except Exception as e:
    conn.rollback()
    print(f"❌ Erreur : {e}")
finally:
    conn.close()