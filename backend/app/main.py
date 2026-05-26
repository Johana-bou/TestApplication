import sys
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app.config import settings

from app.routers import (
    auth_router,
    poste_router,
    utilisateur_router,
    affectation_router,
    unite_router,
    compte_router,
    usager_router,
    pv_router,
    etat_nominatif_router,
    etat_rapprochement_router,
    etat_encaissement_router,
    notification_router,
    config_impression_router,
    audit_log_router,
    ligne_budgetaire_router,
    rapport_router,
)

from app.models import (
    Poste, Utilisateur, Affectation, Unite, Compte, Usager,
    ProcesVerbal, SituationVirement, SituationCheque,
    EtatNominatif, LigneNominatif, EtatRapprochement,
    EtatEncaissement, AuditLog, Notification, ConfigImpression
)

# ── Seed intégré directement — pas de dépendance externe ─────
def _run_seed(db):
    """Initialise la BD avec les données de base"""
    from app.security.jwt import get_password_hash
    from datetime import date
    try:
        print("⚙️  Création des postes...")
        poste1 = Poste(
            code_poste="488",
            nom_poste="Recette principale des Douanes de MAROUA",
            adresse="Maroua, Extreme-Nord, Cameroun"
        )
        poste2 = Poste(
            code_poste="490",
            nom_poste="Recette principale des Douanes de LIMANI",
            adresse="Limani, Extreme-Nord, Cameroun"
        )
        db.add_all([poste1, poste2])
        db.flush()
        print(f"  [OK] {poste1.nom_poste}")
        print(f"  [OK] {poste2.nom_poste}")

        print("⚙️  Création des comptes...")
        comptes = [
            Compte(num_compte="4121226488", nom_compte="Recette douane MAROUA", id_poste=poste1.id_poste),
            Compte(num_compte="4121226490", nom_compte="Recette douane LIMANI", id_poste=poste2.id_poste),
            Compte(num_compte="4711", nom_compte="Caisse des Douanes", id_poste=None),
            Compte(num_compte="4712", nom_compte="Caisse des Douanes - Regionale", id_poste=None),
            Compte(num_compte="5111", nom_compte="Virements recus", id_poste=None),
            Compte(num_compte="5112", nom_compte="Cheques recus", id_poste=None),
            Compte(num_compte="5211", nom_compte="Recettes diverses", id_poste=None),
        ]
        db.add_all(comptes)
        db.flush()
        print(f"  [OK] {len(comptes)} comptes créés")

        print("⚙️  Création des unités...")
        unites = []
        for poste in [poste1, poste2]:
            for nom in ["Bureau des operations", "Service contentieux", "Bureau des douanes", "Service recettes"]:
                unites.append(Unite(id_poste=poste.id_poste, nom_unite=nom))
        db.add_all(unites)
        db.flush()
        print(f"  [OK] {len(unites)} unités créées")

        print("⚙️  Création de l'administrateur...")
        admin = Utilisateur(
            nom="ADMIN",
            prenom="Systeme",
            pseudo="admin",
            email="admin@douane.cm",
            mot_de_passe=get_password_hash("douane2026"),
            role="ADMIN",
            poste_id=poste1.id_poste,
            actif=True
        )
        db.add(admin)
        db.flush()

        # Affectation admin aux deux postes
        db.add(Affectation(id_user=admin.id_user, id_poste=poste1.id_poste, date_debut=date.today()))
        db.add(Affectation(id_user=admin.id_user, id_poste=poste2.id_poste, date_debut=date.today()))
        print("  [OK] admin / douane2026")

        print("⚙️  Création des configurations d'impression...")
        configs = [
            ConfigImpression(
                id_poste=poste1.id_poste,
                logo_path=None,
                entete="RECETTE PRINCIPALE DES DOUANES DE MAROUA",
                pied_page="Document officiel - Direction Generale des Douanes",
                nom_receveur="Chef de Poste MAROUA",
                grade_receveur="Inspecteur Principal des Douanes"
            ),
            ConfigImpression(
                id_poste=poste2.id_poste,
                logo_path=None,
                entete="RECETTE PRINCIPALE DES DOUANES DE LIMANI",
                pied_page="Document officiel - Direction Generale des Douanes",
                nom_receveur="Chef de Poste LIMANI",
                grade_receveur="Inspecteur Principal des Douanes"
            ),
        ]
        db.add_all(configs)

        db.commit()
        print("\n✅ Base de données initialisée avec succès !")
        print("   Identifiants : admin / douane2026")

    except Exception as e:
        print(f"❌ Erreur lors du seed: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()

def seed_if_empty():
    """Vérifie si la BD est vide et lance le seed si nécessaire"""
    db = SessionLocal()
    try:
        # ✅ Crée les tables d'abord
        Base.metadata.create_all(bind=engine)
        count = db.query(Poste).count()
        if count == 0:
            print("\n📦 Base de données vide — initialisation en cours...")
            _run_seed(db)
        else:
            print(f"✅ Base de données déjà initialisée ({count} postes)")
    except Exception as e:
        print(f"❌ Erreur seed_if_empty: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("\n🚀 Démarrage de l'application...")
    # ✅ Création des tables
    Base.metadata.create_all(bind=engine)
    print("✅ Tables créées/vérifiées")
    # ✅ Seed si nécessaire
    seed_if_empty()
    print("✅ Base de données prête\n")
    yield
    print("🛑 Arrêt de l'application")

# ── Application FastAPI ───────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Système de gestion des procès-verbaux de contrôle interne des douanes",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:8000",
        "file://",
        "null",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────
app.include_router(auth_router,               prefix="/api/auth",                  tags=["Authentification"])
app.include_router(utilisateur_router,        prefix="/api/utilisateurs",          tags=["Utilisateurs"])
app.include_router(affectation_router,        prefix="/api/affectations",          tags=["Affectations"])
app.include_router(poste_router,              prefix="/api/postes",                tags=["Postes"])
app.include_router(unite_router,              prefix="/api/unites",                tags=["Unités"])
app.include_router(compte_router,             prefix="/api/comptes",               tags=["Comptes"])
app.include_router(usager_router,             prefix="/api/usagers",               tags=["Usagers"])
app.include_router(pv_router,                prefix="/api/pv",                    tags=["Procès-Verbal"])
app.include_router(etat_nominatif_router,     prefix="/api/etats-nominatifs",      tags=["États Nominatifs"])
app.include_router(etat_rapprochement_router, prefix="/api/etats-rapprochement",   tags=["États Rapprochement"])
app.include_router(etat_encaissement_router,  prefix="/api/etats-encaissement",    tags=["États Encaissement"])
app.include_router(ligne_budgetaire_router.router, prefix="/api/lignes-budgetaires")
app.include_router(rapport_router.router)
app.include_router(notification_router,       prefix="/api/notifications",         tags=["Notifications"])
app.include_router(config_impression_router,  prefix="/api/config-impression",     tags=["Configuration Impression"])
app.include_router(audit_log_router,          prefix="/api/audit-logs",            tags=["Audit Logs"])

# ── Routes de base ────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "message": "Douane PV System API",
        "status": "running",
        "version": "1.0.0",
    }

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.get("/api/info")
def get_info():
    return {
        "name": settings.APP_NAME,
        "version": "1.0.0",
        "database": "SQLite",
        "database_path": settings.DB_PATH if hasattr(settings, 'DB_PATH') else "~/.douanegestion/data.db"
    }
