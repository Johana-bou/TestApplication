import sys
import os
from PyInstaller.utils.hooks import collect_all, collect_submodules

datas = []
binaries = []
hiddenimports = []

# ✅ NE PAS inclure 'dotenv' ici — ce n'est pas un package PyInstaller
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
        ('app', 'app'),
        ('.env', '.'),
        ('douanes.db', '.'),
    ],
    hiddenimports=hiddenimports + collect_submodules('uvicorn') + collect_submodules('dotenv') + [
        # ✅ uvicorn complet
        'uvicorn',
        'uvicorn.main',
        'uvicorn.config',
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.loops.asyncio',
        'uvicorn.loops.uvloop',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.http.h11_impl',
        'uvicorn.protocols.http.httptools_impl',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.protocols.websockets.websockets_impl',
        'uvicorn.protocols.websockets.wsproto_impl',
        'uvicorn.lifespan',
        'uvicorn.lifespan.off',
        'uvicorn.lifespan.on',
        'uvicorn.supervisors',
        'uvicorn.supervisors.basereload',
        'uvicorn.supervisors.multiprocess',
        # ✅ python-dotenv (importé comme 'dotenv' dans le code)
        'dotenv',
        'dotenv.main',
        'dotenv.parser',
        'dotenv.variables',
        'dotenv.compat',
        # ✅ Dépendances indirectes
        'h11',
        'h11._connection',
        'h11._events',
        'h11._readers',
        'h11._writers',
        'click',
        'anyio',
        'anyio._backends._asyncio',
        'anyio.abc',
        'sniffio',
        'email_validator',
        # ✅ Autres packages du requirements.txt souvent manqués
        'passlib',
        'passlib.handlers',
        'passlib.handlers.bcrypt',
        'jose',
        'jose.jwt',
        'multipart',
        'pymysql',
        'pydantic_settings',
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
    console=True,  # ✅ True pour voir les erreurs dans CMD
    onefile=True,
)
