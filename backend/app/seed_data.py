# seed_data.py (version allégée)
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine, Base
from app.models import Poste, Utilisateur, Affectation, Unite, Compte, ConfigImpression
from app.security.jwt import get_password_hash
from datetime import date

def seed_database():
    print("\n" + "="*70)
    print("INITIALISATION DE LA BASE DE DONNEES SQLite (version minimale)")
    print("="*70)
    
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("[OK] Tables creees")
    
    db = SessionLocal()
    try:
        # 1. Postes
        print("\nCreation des postes...")
        postes_data = [
            {
                "code_poste": "488",
                "nom_poste": "Recette principale des Douanes de MAROUA",
                "adresse": "Maroua, Extreme-Nord, Cameroun"
            },
            {
                "code_poste": "490",
                "nom_poste": "Recette principale des Douanes de LIMANI",
                "adresse": "Limani, Extreme-Nord, Cameroun"
            },
        ]
        postes = []
        for p_data in postes_data:
            poste = Poste(**p_data)
            db.add(poste)
            db.flush()
            postes.append(poste)
            print(f"  [OK] {poste.nom_poste} (code: {poste.code_poste})")
        
        # 2. Comptes (specifiques aux postes + generaux)
        print("\nCreation des comptes...")
        comptes_data = [
            {"num_compte": "4121226488", "nom_compte": "Recette douane MAROUA", "id_poste": postes[0].id_poste},
            {"num_compte": "4121226490", "nom_compte": "Recette douane LIMANI", "id_poste": postes[1].id_poste},
            {"num_compte": "4711", "nom_compte": "Caisse des Douanes", "id_poste": None},
            {"num_compte": "4712", "nom_compte": "Caisse des Douanes - Regionale", "id_poste": None},
            {"num_compte": "5111", "nom_compte": "Virements recus", "id_poste": None},
            {"num_compte": "5112", "nom_compte": "Cheques recus", "id_poste": None},
            {"num_compte": "5211", "nom_compte": "Recettes diverses", "id_poste": None},
        ]
        for c_data in comptes_data:
            compte = Compte(**c_data)
            db.add(compte)
        db.flush()
        print(f"  [OK] {len(comptes_data)} comptes crees")
        
        # 3. Unites (optionnel mais utile)
        print("\nCreation des unites...")
        unites_data = []
        for poste in postes:
            for nom in ["Bureau des operations", "Service contentieux", "Bureau des douanes", "Service recettes"]:
                unites_data.append({"id_poste": poste.id_poste, "nom_unite": nom})
        for u_data in unites_data:
            unite = Unite(**u_data)
            db.add(unite)
        db.flush()
        print(f"  [OK] {len(unites_data)} unites creees")
        
        # 4. Utilisateur admin
        print("\nCreation de l'utilisateur admin...")
        admin = Utilisateur(
            nom="ADMIN",
            prenom="Systeme",
            pseudo="admin",
            email="admin@douane.cm",
            mot_de_passe=get_password_hash("douane2026"),
            role="ADMIN",
            poste_id=postes[0].id_poste,
            actif=True
        )
        db.add(admin)
        db.flush()
        # Affectation
        affectation = Affectation(
            id_user=admin.id_user,
            id_poste=postes[0].id_poste,
            date_debut=date.today(),
            date_fin=None
        )
        db.add(affectation)
        print("  [OK] admin / douane2026")
        
        # 5. Configurations d'impression
        print("\nCreation des configurations d'impression...")
        configs_data = [
            {
                "id_poste": postes[0].id_poste,
                "logo_path": None,
                "entete": "RECETTE PRINCIPALE DES DOUANES DE MAROUA",
                "pied_page": "Document officiel - Direction Generale des Douanes",
                "nom_receveur": "Chef de Poste MAROUA",
                "grade_receveur": "Inspecteur Principal des Douanes"
            },
            {
                "id_poste": postes[1].id_poste,
                "logo_path": None,
                "entete": "RECETTE PRINCIPALE DES DOUANES DE LIMANI",
                "pied_page": "Document officiel - Direction Generale des Douanes",
                "nom_receveur": "Chef de Poste LIMANI",
                "grade_receveur": "Inspecteur Principal des Douanes"
            },
        ]
        for cfg in configs_data:
            config = ConfigImpression(**cfg)
            db.add(config)
        print(f"  [OK] {len(configs_data)} configurations creees")
        
        db.commit()
        print("\n" + "="*70)
        print("BASE DE DONNEES INITIALISEE AVEC SUCCES !")
        print("="*70)
        print("\nIdentifiants de connexion :")
        print("  admin / douane2026")
        print("\nPostes disponibles :")
        for p in postes:
            print(f"  - {p.nom_poste} (code: {p.code_poste})")
        print("="*70 + "\n")
        
    except Exception as e:
        print(f"ERREUR lors de l'initialisation: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

def update_existing_database():
    """Met a jour une base existante avec les donnees manquantes (postes, admin)"""
    db = SessionLocal()
    try:
        print("\nMise a jour de la base existante...")
        # Verifier et ajouter les postes manquants
        postes_codes = [p.code_poste for p in db.query(Poste).all()]
        if "488" not in postes_codes:
            poste = Poste(code_poste="488", nom_poste="Recette principale des Douanes de MAROUA", adresse="Maroua")
            db.add(poste)
            print("  [OK] Poste MAROUA ajoute")
        if "490" not in postes_codes:
            poste = Poste(code_poste="490", nom_poste="Recette principale des Douanes de LIMANI", adresse="Limani")
            db.add(poste)
            print("  [OK] Poste LIMANI ajoute")
        
        # Verifier l'admin
        if db.query(Utilisateur).filter(Utilisateur.pseudo == "admin").count() == 0:
            poste = db.query(Poste).first()
            admin = Utilisateur(
                nom="ADMIN", prenom="Systeme", pseudo="admin",
                email="admin@douane.cm", mot_de_passe=get_password_hash("douane2026"),
                role="ADMIN", poste_id=poste.id_poste, actif=True
            )
            db.add(admin)
            print("  [OK] Utilisateur admin cree")
        db.commit()
        print("Mise a jour terminee.")
    except Exception as e:
        print(f"Erreur: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--update", action="store_true")
    args = parser.parse_args()
    if args.update:
        update_existing_database()
    else:
        seed_database()
