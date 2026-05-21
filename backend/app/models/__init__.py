# app/models/__init__.py
"""
Package des modèles SQLAlchemy pour SQLite avec clés étrangères
"""

from app.database import Base

# Importer d'abord les modèles sans dépendances circulaires
from app.models.poste import Poste
from app.models.utilisateur import Utilisateur
from app.models.affectation import Affectation
from app.models.unite import Unite
from app.models.compte import Compte
from app.models.usager import Usager
from app.models.proces_verbal import ProcesVerbal

# Ensuite les modèles qui dépendent de ProcesVerbal
from app.models.situation_virement import SituationVirement
from app.models.situation_cheque import SituationCheque

# Puis les autres modèles
from app.models.etat_nominatif import EtatNominatif
from app.models.ligne_nominatif import LigneNominatif
from app.models.etat_rapprochement import EtatRapprochement
from app.models.etat_encaissement import EtatEncaissement
from app.models.audit_log import AuditLog
from app.models.notification import Notification
from app.models.config_impression import ConfigImpression
from .etat_encaissement import EtatEncaissement
from .ligne_budgetaire import LigneBudgetaire


__all__ = [
    "Base",
    "Poste",
    "Utilisateur",
    "Affectation",
    "Unite",
    "Compte",
    "Usager",
    "ProcesVerbal",
    "SituationVirement",
    "SituationCheque",
    "EtatNominatif",
    "LigneNominatif",
    "EtatRapprochement",
    "EtatEncaissement",
    "LigneBudgetaire",
    "AuditLog",
    "Notification",
    "ConfigImpression"
]