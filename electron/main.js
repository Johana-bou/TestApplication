const { app, BrowserWindow, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');
const fs = require('fs');

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
    env: {
      ...process.env,
      PORT: String(API_PORT),
      APP_ENV: 'production',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
  });

  pythonProcess.stdout.on('data', d => console.log(`[Backend] ${d}`));
  pythonProcess.stderr.on('data', d => console.error(`[Backend ERR] ${d}`));
  pythonProcess.on('close', (code) => {
    console.log(`[Backend] Arrêté avec code ${code}`);
  });
}

// ── Attendre que FastAPI réponde ──────────────────────────────
function waitForBackend(retries = 60) {  // ✅ 60 tentatives = 60 secondes max
  return new Promise((resolve) => {
    let attempts = 0;

    const check = () => {
      const req = http.get(
        `http://127.0.0.1:${API_PORT}/health`,
        (res) => {
          if (res.statusCode === 200) {
            console.log('[Electron] ✅ Backend prêt !');
            resolve(true);
          } else {
            retry();
          }
        }
      );
      req.setTimeout(2000);
      req.on('error', retry);
      req.on('timeout', () => { req.destroy(); retry(); });
      req.end();
    };

    const retry = () => {
      attempts++;
      if (attempts >= retries) {
        console.error('[Electron] ❌ Backend timeout après 60s');
        resolve(false);
      } else {
        console.log(`[Electron] ⏳ (${attempts}/${retries}) Attente backend...`);
        setTimeout(check, 1000);
      }
    };

    // ✅ Attendre 3s avant le premier check (le backend a besoin de temps pour démarrer)
    setTimeout(check, 3000);
  });
}

// ── Créer la fenêtre principale ───────────────────────────────
async function createWindow() {
  // ✅ D'abord une fenêtre de chargement
  let loadingWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    alwaysOnTop: true,
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
    dialog.showErrorBox(
      'Erreur',
      'Impossible de démarrer le backend. Relancez l\'application.'
    );
    app.quit();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    title: 'DouaneGestion',
    show: false,  // ✅ Ne montre la fenêtre qu'une fois prête
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const startUrl = app.isPackaged
    ? `file://${path.join(__dirname, 'renderer', 'index.html')}`
    : 'http://localhost:5173';

  mainWindow.loadURL(startUrl);

  // ✅ Affiche la fenêtre seulement quand elle est prête
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.maximize();
  });
}

// ── Cycle de vie ──────────────────────────────────────────────
app.whenReady().then(() => {
  startBackend();          // ✅ Lance le backend
  createWindow();          // ✅ Attend que le backend soit prêt avant d'afficher
});

app.on('will-quit', () => {
  if (pythonProcess) {
    pythonProcess.kill();
    console.log('[Electron] Backend arrêté proprement.');
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});