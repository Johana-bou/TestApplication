import sys
import os
import uvicorn

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
    from app.main import app
    print("✅ Application FastAPI chargée avec succès")
except Exception as e:
    print(f"❌ Erreur lors du chargement de l'application : {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Démarrer le serveur
if __name__ == '__main__':
    uvicorn.run(
        app,           # Objet app directement
        host='127.0.0.1',
        port=PORT,
        reload=False,
        log_level='info',
    )
