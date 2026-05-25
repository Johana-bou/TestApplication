import sys
import os

# ✅ Forcer l'encodage UTF-8 pour les consoles Windows
if sys.platform == "win32":
    sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', errors='replace')
    sys.stderr = open(sys.stderr.fileno(), mode='w', encoding='utf-8', errors='replace')

# ✅ Résolution des chemins (PyInstaller compatible)
if getattr(sys, 'frozen', False):
    BASE_DIR = sys._MEIPASS
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

sys.path.insert(0, BASE_DIR)

# ✅ Charger les variables d'environnement
from dotenv import load_dotenv
load_dotenv(os.path.join(BASE_DIR, '.env'))

# ✅ NE PAS forcer DATABASE_URL ici
# La BD est gérée dans app/database.py → LOCALAPPDATA/GestionReceveur/data.db
# ce chemin est permanent et ne sera pas effacé entre les lancements

PORT = int(os.environ.get('PORT', 8000))

# ✅ Import sécurisé de l'application FastAPI
try:
    import uvicorn
    print("[OK] uvicorn importé")
    from app.main import app as fastapi_app  # ✅ Pas de conflit de nom
    print("[OK] app.main importé")
except Exception as e:
    print(f"[ERREUR] Exception lors de l'import: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# ✅ Démarrer le serveur
if __name__ == '__main__':
    print(f"[INFO] Démarrage sur http://127.0.0.1:{PORT}")
    uvicorn.run(
        fastapi_app,
        host='127.0.0.1',
        port=PORT,
        reload=False,
        log_level='info',
    )
    