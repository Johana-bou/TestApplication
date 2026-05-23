import sys
import os

# ── Résolution des chemins (PyInstaller compatible) ───────────
if getattr(sys, 'frozen', False):
    # Mode packagé : fichiers extraits dans sys._MEIPASS
    BASE_DIR = sys._MEIPASS
else:
    # Mode développement
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ── Charger les variables d'environnement ─────────────────────
from dotenv import load_dotenv
load_dotenv(os.path.join(BASE_DIR, '.env'))

# ── Forcer SQLAlchemy à trouver la DB au bon endroit ──────────
DB_PATH = os.path.join(BASE_DIR, 'douanes.db')
os.environ.setdefault('DATABASE_URL', f'sqlite:///{DB_PATH}')

# ── Lire le port depuis la variable d'env (injectée par Electron) ──
PORT = int(os.environ.get('PORT', 8000))

# ── Démarrage Uvicorn ─────────────────────────────────────────
if __name__ == '__main__':
    import uvicorn
    uvicorn.run(
        'app.main:app',
        host='127.0.0.1',   # localhost uniquement, plus sécurisé
        port=PORT,
        reload=False,
        log_level='info',
    )
