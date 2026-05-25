import sys
import os
import uvicorn

# Forcer l'encodage UTF-8 pour les consoles Windows
if sys.platform == "win32":
    sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', errors='replace')
    sys.stderr = open(sys.stderr.fileno(), mode='w', encoding='utf-8', errors='replace')

# Résolution des chemins
if getattr(sys, 'frozen', False):
    BASE_DIR = sys._MEIPASS
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

sys.path.insert(0, BASE_DIR)

# Charger les variables d'environnement
from dotenv import load_dotenv
load_dotenv(os.path.join(BASE_DIR, '.env'))

# Configurer la base de données
DB_PATH = os.path.join(BASE_DIR, 'douanes.db')
os.environ.setdefault('DATABASE_URL', f'sqlite:///{DB_PATH}')

PORT = int(os.environ.get('PORT', 8000))

# Importer l'application FastAPI
try:
    import app.main
    print("[OK] Module app.main importé")
    if hasattr(app.main, 'app'):
        app = app.main.app
        print("[OK] Objet 'app' trouvé")
    else:
        print("[ERREUR] L'objet 'app' n'existe pas dans app.main")
        print("Contenu de app.main :", dir(app.main))
        sys.exit(1)
except Exception as e:
    print(f"[ERREUR] Exception lors de l'import: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Démarrer le serveur
if __name__ == '__main__':
    uvicorn.run(
        app,
        host='127.0.0.1',
        port=PORT,
        reload=False,
        log_level='info',
    )
