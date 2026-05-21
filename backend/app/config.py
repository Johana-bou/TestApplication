# app/config.py
import os
import sys

# Dossier de données selon l'OS
if sys.platform == "win32":
    APP_DIR = os.path.join(os.environ.get("LOCALAPPDATA", os.path.expanduser("~")), "GestionReceveur")
else:
    APP_DIR = os.path.join(os.path.expanduser("~"), ".gestion-receveur")

os.makedirs(APP_DIR, exist_ok=True)

class Settings:
    # Base de données
    DB_PATH: str = os.path.join(APP_DIR, "data.db")
    DATABASE_URL: str = f"sqlite:///{DB_PATH}"
    
    # Sécurité
    SECRET_KEY: str = "votre-clé-secrete-changez-la-en-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    
    # Application
    APP_NAME: str = "Douane PV System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    @classmethod
    def ensure_directories(cls):
        """Crée les dossiers nécessaires"""
        os.makedirs(cls.DB_PATH.replace("data.db", ""), exist_ok=True)

settings = Settings()

def get_database_url() -> str:
    return settings.DATABASE_URL
