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

# ── Gestion du chargement de seed ────────────────────────────
def seed_if_empty():
    db = SessionLocal()
    try:
        count = db.query(Poste).count()
        if count == 0:
            try:
                # ✅ Résolution du chemin compatible PyInstaller
                if getattr(sys, 'frozen', False):
                    scripts_dir = os.path.join(sys._MEIPASS, 'scripts')
                    sys.path.insert(0, sys._MEIPASS)
                else:
                    scripts_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'scripts')
                    sys.path.insert(0, os.path.dirname(scripts_dir))

                from scripts.seed_data import seed_database
                seed_database()
                print("✅ Données initiales créées avec succès")
            except ImportError as e:
                print(f"⚠️ Module scripts.seed_data introuvable: {e}")
                # ✅ Fallback : créer uniquement l'admin si le seed échoue
                _create_admin_fallback(db)
            except Exception as e:
                print(f"❌ Erreur lors du seed: {e}")
                import traceback
                traceback.print_exc()
        else:
            print(f"✅ Base de données déjà initialisée ({count} postes)")
    except Exception as e:
        print(f"❌ Erreur de connexion ou de vérification: {e}")
    finally:
        db.close()

def _create_admin_fallback(db):
    """Crée un admin minimal si le seed complet échoue"""
    try:
        from app.security.jwt import get_password_hash
        # Créer un poste par défaut
        poste = db.query(Poste).first()
        if not poste:
            poste = Poste(
                code_poste="488",
                nom_poste="Recette principale des Douanes de MAROUA",
                adresse="Maroua, Extreme-Nord, Cameroun"
            )
            db.add(poste)
            db.flush()

        # Créer l'admin si inexistant
        admin_existe = db.query(Utilisateur).filter(Utilisateur.pseudo == "admin").first()
        if not admin_existe:
            admin = Utilisateur(
                nom="ADMIN",
                prenom="Systeme",
                pseudo="admin",
                email="admin@douane.cm",
                mot_de_passe=get_password_hash("douane2026"),
                role="ADMIN",
                poste_id=poste.id_poste,
                actif=True
            )
            db.add(admin)
            db.commit()
            print("✅ Admin créé (fallback) : admin / douane2026")
    except Exception as e:
        print(f"❌ Erreur fallback admin: {e}")
        db.rollback()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # ✅ Création des tables en premier
    Base.metadata.create_all(bind=engine)
    print("✅ Tables créées/vérifiées")
    # ✅ Peuplement initial
    seed_if_empty()
    print("✅ Base de données prête")
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
