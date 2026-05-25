import sys
import os
import uvicorn

# ── Résolution des chemins (PyInstaller compatible) ───────────
if getattr(sys, 'frozen', False):
    BASE_DIR = sys._MEIPASS
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 🔧 AJOUTER CETTE LIGNE : permet à Python de trouver les modules (app, scripts, etc.)
sys.path.insert(0, BASE_DIR)

# ── Charger les variables d'environnement ─────────────────────
from dotenv import load_dotenv
load_dotenv(os.path.join(BASE_DIR, '.env'))

# ── Forcer SQLAlchemy à trouver la DB au bon endroit ──────────
DB_PATH = os.path.join(BASE_DIR, 'douanes.db')
os.environ.setdefault('DATABASE_URL', f'sqlite:///{DB_PATH}')

# ── Lire le port depuis la variable d'env ─────────────────────
PORT = int(os.environ.get('PORT', 8000))

# ── Démarrage Uvicorn ─────────────────────────────────────────
if __name__ == '__main__':
    uvicorn.run(
        'app.main:app',
        host='127.0.0.1',
        port=PORT,
        reload=False,
        log_level='info',
    )import sys
import os
import uvicorn  # ✅ Import en haut, détecté par PyInstaller

# ── Résolution des chemins (PyInstaller compatible) ───────────
if getattr(sys, 'frozen', False):
    BASE_DIR = sys._MEIPASS
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ── Charger les variables d'environnement ─────────────────────
from dotenv import load_dotenv
load_dotenv(os.path.join(BASE_DIR, '.env'))

# ── Forcer SQLAlchemy à trouver la DB au bon endroit ──────────
DB_PATH = os.path.join(BASE_DIR, 'douanes.db')
os.environ.setdefault('DATABASE_URL', f'sqlite:///{DB_PATH}')

# ── Lire le port depuis la variable d'env ─────────────────────
PORT = int(os.environ.get('PORT', 8000))

# ── Démarrage Uvicorn ─────────────────────────────────────────
if __name__ == '__main__':
    uvicorn.run(
        'app.main:app',
        host='127.0.0.1',
        port=PORT,
        reload=False,
        log_level='info',
    )
