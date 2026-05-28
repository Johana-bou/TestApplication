const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');
const fs = require('fs');
const os = require('os');

let mainWindow = null;
let pythonProcess = null;
const API_PORT = 8000;

// ── Trouver le backend embarqué ───────────────────────────────
function getBackendPath() {
  const exeName = process.platform === 'win32' ? 'run.exe' : 'run';
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'backend', exeName);
  } else {
    return path.join(__dirname, '..', 'backend', 'dist', exeName);
  }
}

// ── Démarrer le backend FastAPI ───────────────────────────────
function startBackend() {
  const backendPath = getBackendPath();
  if (!fs.existsSync(backendPath)) {
    dialog.showErrorBox('Erreur démarrage', `Backend introuvable :\n${backendPath}`);
    app.quit();
    return;
  }
  console.log('[Electron] Démarrage backend:', backendPath);
  pythonProcess = spawn(backendPath, [], {
    env: { ...process.env, PORT: String(API_PORT), APP_ENV: 'production' },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
  });
  pythonProcess.stdout.on('data', d => console.log(`[Backend] ${d}`));
  pythonProcess.stderr.on('data', d => console.error(`[Backend ERR] ${d}`));
  pythonProcess.on('close', code => console.log(`[Backend] Arrêté avec code ${code}`));
}

// ── Attendre que FastAPI réponde ──────────────────────────────
function waitForBackend(retries = 60) {
  return new Promise((resolve) => {
    let attempts = 0;
    const check = () => {
      const req = http.get(`http://127.0.0.1:${API_PORT}/health`, (res) => {
        if (res.statusCode === 200) {
          console.log('[Electron] ✅ Backend prêt !');
          resolve(true);
        } else retry();
      });
      req.setTimeout(2000);
      req.on('error', retry);
      req.on('timeout', () => { req.destroy(); retry(); });
      req.end();
    };
    const retry = () => {
      attempts++;
      if (attempts >= retries) { console.error('[Electron] ❌ Backend timeout'); resolve(false); }
      else { console.log(`[Electron] ⏳ (${attempts}/${retries}) Attente backend...`); setTimeout(check, 1000); }
    };
    setTimeout(check, 3000);
  });
}

// ── IPC : Impression PDF (ouvrir dans visualiseur par défaut) ──
ipcMain.handle('print-pdf', async (event, { base64Data, fileName }) => {
  try {
    const tmpFile = path.join(os.tmpdir(), fileName || 'document.pdf');
    fs.writeFileSync(tmpFile, Buffer.from(base64Data, 'base64'));
    console.log(`[Electron] PDF écrit : ${tmpFile}`);

    await shell.openPath(tmpFile);
    setTimeout(() => {
      try { fs.unlinkSync(tmpFile); } catch {}
    }, 120000);

    return { success: true, path: tmpFile };
  } catch (err) {
    console.error('[Electron] Erreur print-pdf:', err);
    return { success: false, error: err.message };
  }
});

// ── IPC : Télécharger PDF ─────────────────────────────────────
ipcMain.handle('download-pdf', async (event, { base64Data, fileName }) => {
  try {
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      defaultPath: path.join(os.homedir(), 'Documents', fileName || 'document.pdf'),
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });
    if (!filePath) return { success: false, cancelled: true };
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);
    console.log(`[Electron] PDF sauvegardé : ${filePath}`);
    return { success: true, path: filePath };
  } catch (err) {
    console.error('[Electron] Erreur download-pdf:', err);
    return { success: false, error: err.message };
  }
});

// ── Créer la fenêtre principale ───────────────────────────────
async function createWindow() {
  let loadingWindow = new BrowserWindow({
    width: 400, height: 300, frame: false, alwaysOnTop: true,
    webPreferences: { nodeIntegration: true, contextIsolation: false }
  });
  loadingWindow.loadURL(`data:text/html,
    <html>
      <body style="background:#1a1a2e;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:Arial">
        <h2 style="color:#fff;margin-bottom:10px">DouaneGestion</h2>
        <p style="color:#aaa">Démarrage en cours...</p>
        <p style="color:#666;font-size:12px">Initialisation de la base de données</p>
      </body>
    </html>
  `);

  const backendReady = await waitForBackend();
  loadingWindow.close();
  loadingWindow = null;

  if (!backendReady) {
    dialog.showErrorBox('Erreur', 'Impossible de démarrer le backend. Relancez l\'application.');
    app.quit();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1280, height: 800, minWidth: 1024, minHeight: 600,
    title: 'DouaneGestion', show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  const startUrl = app.isPackaged
    ? `file://${path.join(__dirname, 'renderer', 'index.html')}`
    : 'http://localhost:5173';

  mainWindow.loadURL(startUrl);
  mainWindow.once('ready-to-show', () => { mainWindow.show(); mainWindow.maximize(); });
}

// ── Cycle de vie ──────────────────────────────────────────────
app.whenReady().then(() => {
  startBackend();
  createWindow();
});

app.on('will-quit', () => {
  if (pythonProcess) { pythonProcess.kill(); console.log('[Electron] Backend arrêté.'); }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});