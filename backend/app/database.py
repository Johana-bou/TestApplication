# app/database.py
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
import os
import sys

# ── Dossier de données selon l'OS ────────────────────────────
if sys.platform == "win32":
    APP_DIR = os.path.join(
        os.environ.get("LOCALAPPDATA", os.path.expanduser("~")),
        "SIGREC"  # ✅ Renommé
    )
else:
    APP_DIR = os.path.join(os.path.expanduser("~"), ".sigrec")  # ✅ Renommé

os.makedirs(APP_DIR, exist_ok=True)
DB_PATH = os.path.join(APP_DIR, "data.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"
print(f"[SIGREC] Base de données : {DB_PATH}")

# ── Configuration du moteur SQLite ───────────────────────────
engine = create_engine(
    DATABASE_URL,
    connect_args={
        "check_same_thread": False,
        "timeout": 30,        # ✅ 30s max pour acquérir un verrou SQLite
    },
    pool_timeout=30,          # ✅ 30s max pour obtenir une connexion du pool
    pool_pre_ping=True,       # ✅ Vérifie que la connexion est vivante
    echo=False
)

# ── Activer les clés étrangères + WAL mode pour SQLite ───────
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON;")
    cursor.execute("PRAGMA journal_mode=WAL;")   # ✅ WAL évite les verrous en lecture/écriture simultanée
    cursor.execute("PRAGMA synchronous=NORMAL;") # ✅ Meilleur équilibre perf/sécurité
    cursor.execute("PRAGMA cache_size=10000;")   # ✅ Cache plus grand = moins de lectures disque
    cursor.execute("PRAGMA temp_store=MEMORY;")  # ✅ Fichiers temporaires en mémoire
    cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    """Dépendance FastAPI pour obtenir une session DB"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db() -> None:
    """Initialise la base de données"""
    Base.metadata.create_all(bind=engine)
    print("✅ Base de données SIGREC initialisée")
