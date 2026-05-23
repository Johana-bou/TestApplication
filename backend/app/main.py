# app/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app.config import settings
from app.routers import ligne_budgetaire_router, etat_encaissement_router, rapport_router

# Imports des modèles
from app.models import (
    Poste, Utilisateur, Affectation, Unite, Compte, Usager,
    ProcesVerbal, SituationVirement, SituationCheque,
    EtatNominatif, LigneNominatif, EtatRapprochement,
    EtatEncaissement, AuditLog, Notification, ConfigImpression
)

# Imports des routers
from app.routers import (
    auth_router, poste_router, utilisateur_router,
    affectation_router, unite_router, compte_router,
    usager_router, pv_router, etat_nominatif_router,
    etat_rapprochement_router, etat_encaissement_router,
    notification_router, config_impression_router, audit_log_router
)

# ── Initialisation DB au démarrage (pas à l'import) ──────────
def seed_if_empty():
    db = SessionLocal()
    try:
        if db.query(Poste).count() == 0:
            from scripts.seed_data import seed_database
            seed_database()
            print("Données initiales créées avec succès")
        else:
            print("Base de données déjà initialisée")
    except Exception as e:
        print(f"Erreur lors du seed: {e}")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # ✅ S'exécute APRÈS que run.py ait défini DATABASE_URL et BASE_DIR
    Base.metadata.create_all(bind=engine)
    seed_if_empty()
    print("✅ Base de données initialisée")
    yield
    # Code de nettoyage à l'arrêt (optionnel)
    print("🛑 Arrêt de l'application")

# ── Application FastAPI ───────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Système de gestion des procès-verbaux de contrôle interne des douanes",
    lifespan=lifespan,   # ← remplace les anciens @app.on_event
)

# ── CORS ──────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # dev React (Vite)
        "http://localhost:3000",   # dev React alternatif
        "http://127.0.0.1:8000",  # backend lui-même
        "file://",                 # Electron packagé (Windows/Linux)
        "null",                    # origine file:// sur certains OS
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
