import sys
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app.config import settings

# Import des routers (assurez-vous que ces modules existent)
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

# Import des modèles pour la création des tables (nécessaire pour SQLAlchemy)
from app.models import (
    Poste, Utilisateur, Affectation, Unite, Compte, Usager,
    ProcesVerbal, SituationVirement, SituationCheque,
    EtatNominatif, LigneNominatif, EtatRapprochement,
    EtatEncaissement, AuditLog, Notification, ConfigImpression
)

# ── Gestion du chargement de seed (scripts) ──────────────────────
def seed_if_empty():
    db = SessionLocal()
    try:
        # Vérifier si la table Poste existe et contient des données
        if db.query(Poste).count() == 0:
            # Importer seed_database de manière sécurisée
            try:
                from scripts.seed_data import seed_database
                seed_database()
                print("Données initiales créées avec succès")
            except ImportError as e:
                print(f"Module scripts.seed_data introuvable: {e}")
            except Exception as e:
                print(f"Erreur lors du seed: {e}")
        else:
            print("Base de données déjà initialisée")
    except Exception as e:
        print(f"Erreur de connexion ou de vérification: {e}")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Création des tables si absentes
    Base.metadata.create_all(bind=engine)
    # Peuplement initial (optionnel)
    seed_if_empty()
    print("Base de données initialisée")
    yield
    print("Arrêt de l'application")

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
app.include_router(auth_router,              prefix="/api/auth",             tags=["Authentification"])
app.include_router(utilisateur_router,       prefix="/api/utilisateurs",     tags=["Utilisateurs"])
app.include_router(affectation_router,       prefix="/api/affectations",     tags=["Affectations"])
app.include_router(poste_router,             prefix="/api/postes",           tags=["Postes"])
app.include_router(unite_router,             prefix="/api/unites",           tags=["Unités"])
app.include_router(compte_router,            prefix="/api/comptes",          tags=["Comptes"])
app.include_router(usager_router,            prefix="/api/usagers",          tags=["Usagers"])
app.include_router(pv_router,               prefix="/api/pv",               tags=["Procès-Verbal"])
app.include_router(etat_nominatif_router,    prefix="/api/etats-nominatifs", tags=["États Nominatifs"])
app.include_router(etat_rapprochement_router,prefix="/api/etats-rapprochement", tags=["États Rapprochement"])
app.include_router(etat_encaissement_router, prefix="/api/etats-encaissement",  tags=["États Encaissement"])
app.include_router(ligne_budgetaire_router.router, prefix="/api/lignes-budgetaires")
app.include_router(rapport_router.router)
app.include_router(notification_router,      prefix="/api/notifications",    tags=["Notifications"])
app.include_router(config_impression_router, prefix="/api/config-impression",tags=["Configuration Impression"])
app.include_router(audit_log_router,         prefix="/api/audit-logs",       tags=["Audit Logs"])

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
