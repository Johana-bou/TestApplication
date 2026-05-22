import sys
import os
from PyInstaller.utils.hooks import collect_all, collect_submodules

datas = []
binaries = []
hiddenimports = []

for pkg in ['fastapi', 'uvicorn', 'starlette', 'pydantic', 'anyio']:
    d, b, h = collect_all(pkg)
    datas += d
    binaries += b
    hiddenimports += h

for pkg in ['sqlalchemy']:
    d, b, h = collect_all(pkg)
    datas += d
    binaries += b
    hiddenimports += h

a = Analysis(
    ['run.py'],
    pathex=['.'],
    binaries=binaries,
    datas=datas + [
        ('app', 'app'),
        ('.env', '.'),
        ('douanes.db', '.'),
    ],
    hiddenimports=hiddenimports + collect_submodules('uvicorn'),
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
    console=False,
    onefile=True,
)
