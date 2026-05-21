import uvicorn
from app.main import app

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=False 
    )
# ── Point d'entrée pour PyInstaller ──────────────────────────
if __name__ == "__main__":
    import argparse
    import uvicorn

    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()

    uvicorn.run(
        "app.main:app",    # ← Adaptez selon votre structure
        host="127.0.0.1",
        port=args.port,
        log_level="info"
    )
