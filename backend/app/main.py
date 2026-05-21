# app/main.py
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
    EtatEncaissement,
    AuditLog, Notification, ConfigImpression
)

# Imports des routers
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
    audit_log_router
)

Base.metadata.create_all(bind=engine)


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


seed_if_empty()

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Système de gestion des procès-verbaux de contrôle interne des douanes"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentification et utilisateurs
app.include_router(auth_router, prefix="/api/auth", tags=["Authentification"])
app.include_router(utilisateur_router, prefix="/api/utilisateurs", tags=["Utilisateurs"])
app.include_router(affectation_router, prefix="/api/affectations", tags=["Affectations"])

# Structure
app.include_router(poste_router, prefix="/api/postes", tags=["Postes"])
app.include_router(unite_router, prefix="/api/unites", tags=["Unités"])
app.include_router(compte_router, prefix="/api/comptes", tags=["Comptes"])
app.include_router(usager_router, prefix="/api/usagers", tags=["Usagers"])

# Procès-verbaux
app.include_router(pv_router, prefix="/api/pv", tags=["Procès-Verbal"])

# États
app.include_router(etat_nominatif_router, prefix="/api/etats-nominatifs", tags=["États Nominatifs"])
app.include_router(etat_rapprochement_router, prefix="/api/etats-rapprochement", tags=["États Rapprochement"])
app.include_router(etat_encaissement_router, prefix="/api/etats-encaissement", tags=["États Encaissement"])

# Lignes budgétaires, encaissements et rapports (avec préfixes définis dans les routers)
app.include_router(ligne_budgetaire_router.router, prefix="/api/lignes-budgetaires")
app.include_router(rapport_router.router)

# Utilitaires
app.include_router(notification_router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(config_impression_router, prefix="/api/config-impression", tags=["Configuration Impression"])
app.include_router(audit_log_router, prefix="/api/audit-logs", tags=["Audit Logs"])


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
        "database_path": settings.DB_PATH if hasattr(settings, 'DB_PATH') else "~/.gestion-receveur/data.db"
    }