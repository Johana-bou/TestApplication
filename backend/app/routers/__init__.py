# app/routers/__init__.py
from app.routers.auth_router import router as auth_router
from app.routers.poste_router import router as poste_router
from app.routers.utilisateur_router import router as utilisateur_router
from app.routers.affectation_router import router as affectation_router
from app.routers.unite_router import router as unite_router
from app.routers.compte_router import router as compte_router
from app.routers.usager_router import router as usager_router
from app.routers.pv_router import router as pv_router
from app.routers.etat_nominatif_router import router as etat_nominatif_router
from app.routers.etat_rapprochement_router import router as etat_rapprochement_router
from app.routers.etat_encaissement_router import router as etat_encaissement_router
from app.routers.notification_router import router as notification_router
from app.routers.config_impression_router import router as config_impression_router
from app.routers.audit_log_router import router as audit_log_router

__all__ = [
    "auth_router",
    "poste_router",
    "utilisateur_router",
    "affectation_router",
    "unite_router",
    "compte_router",
    "usager_router",
    "pv_router",
    "etat_nominatif_router",
    "etat_rapprochement_router",
    "etat_encaissement_router",
    "notification_router",
    "config_impression_router",
    "audit_log_router"
]
