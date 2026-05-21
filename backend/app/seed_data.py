# seed_data.py
"""
Script d'initialisation de la base de données SQLite pour l'application Douane PV System
Crée toutes les données de base : postes, utilisateurs, comptes, unités, etc.
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine, Base
from app.models import (
    Poste, Utilisateur, Affectation, Unite, Compte, Usager,
    ProcesVerbal, SituationVirement, SituationCheque,
    EtatNominatif, LigneNominatif, EtatRapprochement,
    EtatEncaissement, SuiviMensuel, SuiviUnite,
    AuditLog, Notification, ConfigImpression
)
from app.security.jwt import get_password_hash
from datetime import datetime, date, timedelta


def seed_database():
    """Initialise la base de données avec les données de base"""
    
    print("\n" + "="*70)
    print("🚀 DÉMARRAGE DE L'INITIALISATION DE LA BASE DE DONNÉES SQLite")
    print("="*70)
    
    # Supprimer et recréer toutes les tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("✅ Tables créées avec succès")
    
    db = SessionLocal()
    
    try:
        # =========================================================
        # 1. CRÉATION DES POSTES
        # =========================================================
        print("\n📌 Création des postes...")
        postes_data = [
            {
                "code_poste": "488",
                "nom_poste": "Recette principale des Douanes de MAROUA",
                "adresse": "Maroua, Région de l'Extrême-Nord, Cameroun"
            },
            {
                "code_poste": "490",
                "nom_poste": "Recette principale des Douanes de LIMANI",
                "adresse": "Limani, Région de l'Extrême-Nord, Cameroun"
            },
        ]
        
        postes = []
        for p_data in postes_data:
            poste = Poste(**p_data)
            db.add(poste)
            db.flush()
            postes.append(poste)
            print(f"   ✅ {poste.nom_poste} (Code: {poste.code_poste})")
        
        # =========================================================
        # 2. CRÉATION DES COMPTES (liés aux postes)
        # =========================================================
        print("\n📌 Création des comptes...")
        comptes_data = [
            # Comptes spécifiques aux postes
            {"num_compte": "4121226488", "nom_compte": "Recette douane MAROUA", "id_poste": postes[0].id_poste},
            {"num_compte": "4121226490", "nom_compte": "Recette douane LIMANI", "id_poste": postes[1].id_poste},
            # Comptes généraux
            {"num_compte": "4711", "nom_compte": "Caisse des Douanes", "id_poste": None},
            {"num_compte": "4712", "nom_compte": "Caisse des Douanes - Régionale", "id_poste": None},
            {"num_compte": "5111", "nom_compte": "Virements reçus", "id_poste": None},
            {"num_compte": "5112", "nom_compte": "Chèques reçus", "id_poste": None},
            {"num_compte": "5211", "nom_compte": "Recettes diverses", "id_poste": None},
        ]
        
        comptes = []
        for c_data in comptes_data:
            compte = Compte(**c_data)
            db.add(compte)
            db.flush()
            comptes.append(compte)
            poste_info = f"Poste: {c_data['id_poste']}" if c_data['id_poste'] else "Général"
            print(f"   ✅ {compte.num_compte} - {compte.nom_compte} ({poste_info})")
        
        # =========================================================
        # 3. CRÉATION DES UNITÉS
        # =========================================================
        print("\n📌 Création des unités...")
        unites_data = [
            {"id_poste": postes[0].id_poste, "nom_unite": "Bureau des opérations"},
            {"id_poste": postes[0].id_poste, "nom_unite": "Service contentieux"},
            {"id_poste": postes[0].id_poste, "nom_unite": "Bureau des douanes"},
            {"id_poste": postes[0].id_poste, "nom_unite": "Service recettes"},
            {"id_poste": postes[1].id_poste, "nom_unite": "Bureau des opérations"},
            {"id_poste": postes[1].id_poste, "nom_unite": "Service contentieux"},
            {"id_poste": postes[1].id_poste, "nom_unite": "Bureau des douanes"},
            {"id_poste": postes[1].id_poste, "nom_unite": "Service recettes"},
        ]
        
        unites = []
        for u_data in unites_data:
            unite = Unite(**u_data)
            db.add(unite)
            db.flush()
            unites.append(unite)
        print(f"   ✅ {len(unites)} unités créées")
        
        # =========================================================
        # 4. CRÉATION DES UTILISATEURS
        # =========================================================
        print("\n📌 Création des utilisateurs...")
        users_data = [
            {
                "nom": "ADMIN", "prenom": "Système", "pseudo": "admin",
                "email": "admin@douane.cm", "role": "ADMIN",
                "poste_id": postes[0].id_poste
            },
            {
                "nom": "DIALLO", "prenom": "Amadou", "pseudo": "agent_488",
                "email": "agent.maroua@douane.cm", "role": "AGENT",
                "poste_id": postes[0].id_poste
            },
            {
                "nom": "MOHAMAN", "prenom": "Ali", "pseudo": "chef_488",
                "email": "chef.maroua@douane.cm", "role": "CHEF",
                "poste_id": postes[0].id_poste
            },
            {
                "nom": "SALI", "prenom": "Bouba", "pseudo": "agent_490",
                "email": "agent.limani@douane.cm", "role": "AGENT",
                "poste_id": postes[1].id_poste
            },
            {
                "nom": "ABDOULAYE", "prenom": "Hamidou", "pseudo": "chef_490",
                "email": "chef.limani@douane.cm", "role": "CHEF",
                "poste_id": postes[1].id_poste
            },
        ]
        
        utilisateurs = []
        for u_data in users_data:
            user = Utilisateur(
                nom=u_data["nom"],
                prenom=u_data["prenom"],
                pseudo=u_data["pseudo"],
                email=u_data["email"],
                mot_de_passe=get_password_hash("douane2026"),
                role=u_data["role"],
                poste_id=u_data["poste_id"],
                actif=True
            )
            db.add(user)
            db.flush()
            utilisateurs.append(user)
            print(f"   ✅ {user.pseudo} ({user.role}) - mot de passe: douane2026")
            
            # Créer l'affectation pour chaque utilisateur
            affectation = Affectation(
                id_user=user.id_user,
                id_poste=u_data["poste_id"],
                date_debut=date.today(),
                date_fin=None
            )
            db.add(affectation)
        
        # =========================================================
        # 5. CRÉATION DES USAGERS
        # =========================================================
        print("\n📌 Création des usagers...")
        usagers_data = [
            {"id_compte": comptes[0].id_compte, "nom_usager": "STE CAMEROUNAISE DES DOUANES", "raison_sociale": "SARL", "telephone": "699123456"},
            {"id_compte": comptes[0].id_compte, "nom_usager": "BOULANGERIE CENTRALE", "raison_sociale": "EURL", "telephone": "699234567"},
            {"id_compte": comptes[1].id_compte, "nom_usager": "TRANSPORT EXPRESS", "raison_sociale": "SA", "telephone": "699345678"},
            {"id_compte": comptes[1].id_compte, "nom_usager": "IMPORT-EXPORT SARL", "raison_sociale": "SARL", "telephone": "699456789"},
        ]
        
        usagers = []
        for us_data in usagers_data:
            usager = Usager(**us_data)
            db.add(usager)
            db.flush()
            usagers.append(usager)
        print(f"   ✅ {len(usagers)} usagers créés")
        
        # =========================================================
        # 6. CRÉATION DES CONFIGURATIONS D'IMPRESSION
        # =========================================================
        print("\n📌 Création des configurations d'impression...")
        configs_data = [
            {
                "id_poste": postes[0].id_poste,
                "logo_path": None,
                "entete": "RECETTE PRINCIPALE DES DOUANES DE MAROUA",
                "pied_page": "Document officiel - Direction Générale des Douanes",
                "nom_receveur": "Chef de Poste MAROUA",
                "grade_receveur": "Inspecteur Principal des Douanes"
            },
            {
                "id_poste": postes[1].id_poste,
                "logo_path": None,
                "entete": "RECETTE PRINCIPALE DES DOUANES DE LIMANI",
                "pied_page": "Document officiel - Direction Générale des Douanes",
                "nom_receveur": "Chef de Poste LIMANI",
                "grade_receveur": "Inspecteur Principal des Douanes"
            },
        ]
        
        for cfg_data in configs_data:
            config = ConfigImpression(**cfg_data)
            db.add(config)
        print(f"   ✅ {len(configs_data)} configurations d'impression créées")
        
        # =========================================================
        # 7. CRÉATION DE PV EXEMPLES (optionnel)
        # =========================================================
        print("\n📌 Création de procès-verbaux d'exemple...")
        
        pv_exemples = []
        for i, poste in enumerate(postes):
            for j in range(2):  # 2 PV par poste
                pv = ProcesVerbal(
                    id_user=utilisateurs[i*2+1].id_user if i == 0 else utilisateurs[i*2+2].id_user,  # agent du poste
                    id_poste=poste.id_poste,
                    num_pv=f"PV-{poste.code_poste}-{2026}-{j+1:03d}",
                    date_pv=date.today() - timedelta(days=j*15),
                    date_dernier_controle=date.today() - timedelta(days=j*15 + 30),
                    date_debut_periode=date.today() - timedelta(days=j*15 + 60),
                    date_fin_periode=date.today() - timedelta(days=j*15 + 30),
                    mouvements_debiteurs=1500000.00 + (j * 500000),
                    mouvements_crediteurs=800000.00 + (j * 300000),
                    solde_theorique=700000.00 + (j * 200000),
                    difference=0.0,
                    observation="Situation conforme" if j == 0 else "À surveiller",
                    date_creation=datetime.utcnow()
                )
                db.add(pv)
                db.flush()
                pv_exemples.append(pv)
                
                # Ajouter des virements
                virement = SituationVirement(
                    id_pv=pv.id_pv,
                    date_virement=date.today() - timedelta(days=10),
                    num_virement=f"VIR-{poste.code_poste}-{j+1:03d}",
                    montant=500000.00,
                    observation="Virement reçu"
                )
                db.add(virement)
                
                # Ajouter des chèques
                cheque = SituationCheque(
                    id_pv=pv.id_pv,
                    date_cheque=date.today() - timedelta(days=5),
                    num_cheque=f"CHQ-{poste.code_poste}-{j+1:03d}",
                    num_dr=f"DR-{j+1:03d}",
                    montant=200000.00,
                    observation="Chèque reçu"
                )
                db.add(cheque)
                
                print(f"   ✅ PV créé: {pv.num_pv} (Poste: {poste.nom_poste})")
        
        # =========================================================
        # 8. CRÉATION D'ÉTATS NOMINATIFS EXEMPLES
        # =========================================================
        print("\n📌 Création d'états nominatifs d'exemple...")
        
        for i, poste in enumerate(postes):
            etat = EtatNominatif(
                id_user=utilisateurs[i*2+1].id_user,
                date_etat=date.today(),
                observation="État nominatif mensuel"
            )
            db.add(etat)
            db.flush()
            
            # Ajouter des lignes
            for j, usager in enumerate(usagers[:2]):
                ligne = LigneNominatif(
                    id_etat=etat.id_etat,
                    id_usager=usager.id_usager,
                    libelle=f"Déclaration {usager.nom_usager}",
                    montant_rar_physique=100000.00 * (j+1),
                    montant_rar_balance=95000.00 * (j+1),
                    ecart=5000.00 * (j+1)
                )
                db.add(ligne)
            print(f"   ✅ État nominatif créé pour {poste.nom_poste}")
        
        # =========================================================
        # 9. CRÉATION D'ÉTATS DE RAPPROCHEMENT EXEMPLES
        # =========================================================
        print("\n📌 Création d'états de rapprochement d'exemple...")
        
        for i, compte in enumerate(comptes[:2]):  # Les 2 premiers comptes spécifiques
            rapprochement = EtatRapprochement(
                id_compte=compte.id_compte,
                id_user=utilisateurs[0].id_user,  # admin
                intitule=f"Rapprochement {compte.num_compte} - {date.today().strftime('%B %Y')}",
                solde_balance=1500000.00,
                operation_acct_non_constate=50000.00,
                operation_poste_non_constate=25000.00,
                solde_theorique=1525000.00,
                ecart=0.00,
                observation="Rapprochement conforme",
                date_rapprochement=date.today()
            )
            db.add(rapprochement)
            print(f"   ✅ Rapprochement créé pour compte {compte.num_compte}")
        
        # =========================================================
        # 10. CRÉATION DE SUIVIS MENSUELS
        # =========================================================
        print("\n📌 Création de suivis mensuels (CAC et Protocole)...")
        
        suivis_data = [
            {"type": "CAC", "id_user": utilisateurs[1].id_user},
            {"type": "protocole", "id_user": utilisateurs[1].id_user},
            {"type": "CAC", "id_user": utilisateurs[3].id_user},
            {"type": "protocole", "id_user": utilisateurs[3].id_user},
        ]
        
        for i, s_data in enumerate(suivis_data):
            suivi = SuiviMensuel(
                id_user=s_data["id_user"],
                type=s_data["type"],
                annee=2026,
                mois=(i % 12) + 1,
                periodicite="mensuel"
            )
            db.add(suivi)
            db.flush()
            
            # Associer des unités à ce suivi
            for unite in unites[:2]:
                suivi_unite = SuiviUnite(
                    id_suivi=suivi.id_suivi,
                    id_unite=unite.id_unite,
                    montant=500000.00
                )
                db.add(suivi_unite)
            print(f"   ✅ Suivi {s_data['type']} créé (mois: {(i % 12) + 1}/2026)")
        
        # =========================================================
        # 11. CRÉATION DE NOTIFICATIONS EXEMPLES
        # =========================================================
        print("\n📌 Création de notifications d'exemple...")
        
        notifications_data = [
            {"id_user": utilisateurs[1].id_user, "type": "INFO", "message": "Bienvenue dans l'application Douane PV System", "lu": False},
            {"id_user": utilisateurs[1].id_user, "type": "SUCCESS", "message": "PV enregistré avec succès", "lu": True},
            {"id_user": utilisateurs[2].id_user, "type": "WARNING", "message": "Pensez à faire le rapprochement mensuel", "lu": False},
            {"id_user": utilisateurs[3].id_user, "type": "INFO", "message": "Nouvelle version disponible", "lu": False},
        ]
        
        for n_data in notifications_data:
            notification = Notification(**n_data)
            db.add(notification)
        print(f"   ✅ {len(notifications_data)} notifications créées")
        
        # =========================================================
        # 12. VALIDATION FINALE
        # =========================================================
        db.commit()
        
        print("\n" + "="*70)
        print("🎉 BASE DE DONNÉES SQLITE INITIALISÉE AVEC SUCCÈS !")
        print("="*70)
        
        # Récapitulatif
        print("\n📊 RÉCAPITULATIF DES DONNÉES CRÉÉES:")
        print("-" * 50)
        print(f"   🏢 Postes: {len(postes)}")
        print(f"   👥 Utilisateurs: {len(utilisateurs)}")
        print(f"   📊 Comptes: {len(comptes)}")
        print(f"   🏛️ Unités: {len(unites)}")
        print(f"   👤 Usagers: {len(usagers)}")
        print(f"   📄 Procès-verbaux: {len(pv_exemples)}")
        print(f"   ⚙️ Configurations impression: {len(configs_data)}")
        print(f"   📋 États nominatifs: {len(postes)}")
        print(f"   🔄 Rapprochements: {len(comptes[:2])}")
        print(f"   📈 Suivis mensuels: {len(suivis_data)}")
        print(f"   🔔 Notifications: {len(notifications_data)}")
        
        print("\n🔑 IDENTIFIANTS DE CONNEXION:")
        print("-" * 50)
        print("\n👑 ADMINISTRATEUR GÉNÉRAL:")
        print("   └─ admin / douane2026")
        
        print("\n🏦 POSTE MAROUA (Code: 488)")
        print("   ├─ Agent: agent_488 / douane2026")
        print("   ├─ Chef: chef_488 / douane2026")
        print("   └─ Compte: 4121226488")
        
        print("\n🏦 POSTE LIMANI (Code: 490)")
        print("   ├─ Agent: agent_490 / douane2026")
        print("   ├─ Chef: chef_490 / douane2026")
        print("   └─ Compte: 4121226490")
        
        print("\n📁 EMPLACEMENT DE LA BASE DE DONNÉES:")
        print(f"   └─ {DB_PATH if 'DB_PATH' in dir() else 'Voir configuration database.py'}")
        
        print("\n💡 TIPS:")
        print("   • Pour accéder à l'API: http://localhost:8000/docs")
        print("   • Pour l'interface React: http://localhost:5173")
        print("   • Mot de passe par défaut: douane2026")
        
        print("\n" + "="*70)
        print("✅ INITIALISATION TERMINÉE - L'APPLICATION EST PRÊTE À ÊTRE UTILISÉE")
        print("="*70 + "\n")
        
    except Exception as e:
        print(f"\n❌ ERREUR lors de l'initialisation: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


def update_existing_database():
    """
    Met à jour une base existante avec les nouvelles données
    (Ajoute les données manquantes sans supprimer l'existant)
    """
    db = SessionLocal()
    try:
        print("\n📌 Mise à jour de la base de données existante...")
        
        # Vérifier et ajouter les postes manquants
        postes_existants = db.query(Poste).all()
        postes_codes = [p.code_poste for p in postes_existants]
        
        if "488" not in postes_codes:
            poste = Poste(
                code_poste="488",
                nom_poste="Recette principale des Douanes de MAROUA",
                adresse="Maroua, Région de l'Extrême-Nord, Cameroun"
            )
            db.add(poste)
            print("   ✅ Poste MAROUA ajouté")
        
        if "490" not in postes_codes:
            poste = Poste(
                code_poste="490",
                nom_poste="Recette principale des Douanes de LIMANI",
                adresse="Limani, Région de l'Extrême-Nord, Cameroun"
            )
            db.add(poste)
            print("   ✅ Poste LIMANI ajouté")
        
        db.commit()
        print("✅ Base de données mise à jour avec succès")
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Initialisation de la base de données SQLite")
    parser.add_argument("--update", action="store_true", help="Met à jour une base existante")
    parser.add_argument("--keep-data", action="store_true", help="Conserve les données existantes")
    args = parser.parse_args()
    
    if args.update:
        update_existing_database()
    elif args.keep_data:
        print("⚠️ Option --keep-data: les tables existantes ne seront pas supprimées")
        # TODO: Implémenter une migration douce
    else:
        seed_database()