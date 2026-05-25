# app/main.py (partie modifiée)
import sys
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app.config import settings
from app.routers import ligne_budgetaire_router, etat_encaissement_router, rapport_router

# ... (tous les autres imports) ...

# Fonction pour importer seed_database dynamiquement
def get_seed_function():
    """Importe seed_database depuis scripts/seed_data.py en gérant le chemin PyInstaller"""
    import importlib.util
    if getattr(sys, 'frozen', False):
        base_path = sys._MEIPASS
    else:
        base_path = os.path.dirname(os.path.dirname(__file__))  # remonte de backend vers racine
    scripts_path = os.path.join(base_path, 'scripts', 'seed_data.py')
    if not os.path.exists(scripts_path):
        raise FileNotFoundError(f"Fichier {scripts_path} introuvable")
    spec = importlib.util.spec_from_file_location("seed_data", scripts_path)
    seed_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(seed_module)
    return seed_module.seed_database

def seed_if_empty():
    db = SessionLocal()
    try:
        if db.query(Poste).count() == 0:
            seed_database = get_seed_function()
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
    Base.metadata.create_all(bind=engine)
    seed_if_empty()
    print("Base de données initialisée")   # ← supprimé le caractère ✅
    yield
    print("Arrêt de l'application")
