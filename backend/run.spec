import sys
import os
from PyInstaller.utils.hooks import collect_all, collect_submodules

datas = []
binaries = []
hiddenimports = []

for pkg in ['fastapi', 'uvicorn', 'starlette', 'pydantic', 'anyio']:
    d, b, h = collect_all(pkg)
    datas += d; binaries += b; hiddenimports += h

for pkg in ['sqlalchemy']:
    d, b, h = collect_all(pkg)
    datas += d; binaries += b; hiddenimports += h

a = Analysis(
    ['run.py'],
    pathex=['.'],
    binaries=binaries,
    datas=datas + [
        ('app', 'app'),           # ✅ Code FastAPI
        ('scripts', 'scripts'),   # ✅ Script de seed
        ('.env', '.'),            # ✅ Variables d'environnement
        # ❌ PAS de douanes.db — la BD se crée automatiquement dans LOCALAPPDATA
    ],
    hiddenimports=hiddenimports + collect_submodules('uvicorn') + collect_submodules('dotenv') + [
        # ✅ uvicorn complet
        'uvicorn', 'uvicorn.main', 'uvicorn.config', 'uvicorn.logging',
        'uvicorn.loops', 'uvicorn.loops.auto', 'uvicorn.loops.asyncio',
        'uvicorn.loops.uvloop', 'uvicorn.protocols', 'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto', 'uvicorn.protocols.http.h11_impl',
        'uvicorn.protocols.http.httptools_impl', 'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto', 'uvicorn.protocols.websockets.websockets_impl',
        'uvicorn.protocols.websockets.wsproto_impl', 'uvicorn.lifespan',
        'uvicorn.lifespan.off', 'uvicorn.lifespan.on', 'uvicorn.supervisors',
        'uvicorn.supervisors.basereload', 'uvicorn.supervisors.multiprocess',
        # ✅ python-dotenv
        'dotenv', 'dotenv.main', 'dotenv.parser', 'dotenv.variables', 'dotenv.compat',
        # ✅ Dépendances indirectes
        'h11', 'h11._connection', 'h11._events', 'h11._readers', 'h11._writers',
        'click', 'anyio', 'anyio._backends._asyncio', 'anyio.abc', 'sniffio',
        'email_validator',
        # ✅ Sécurité / Auth
        'passlib', 'passlib.handlers', 'passlib.handlers.bcrypt',
        'jose', 'jose.jwt',
        'multipart', 'python_multipart',
        # ✅ Base de données
        'pymysql', 'pydantic_settings',
        # ✅ Scripts seed
        'scripts', 'scripts.seed_data',
    ],
    hookspath=[],
    runtime_hooks=[],
    excludes=['tkinter', 'matplotlib', 'numpy', 'pandas'],
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='run',
    debug=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    console=True,  # ✅ True pour voir les logs au démarrage
    onefile=True,
)
