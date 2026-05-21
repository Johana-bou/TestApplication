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
    // En production : dans les ressources embarquées
    return path.join(process.resourcesPath, 'backend', exeName);
  } else {
    // En développement local
    return path.join(__dirname, '..', 'backend', 'dist', exeName);
  }
}

// ── Démarrer le backend FastAPI ───────────────────────────────
function startBackend() {
  const backendPath = getBackendPath();

  if (!fs.existsSync(backendPath)) {
    dialog.showErrorBox(
      'Erreur démarrage',
      `Backend introuvable :\n${backendPath}`
    );
    app.quit();
    return;
  }

  console.log('[Electron] Démarrage backend:', backendPath);

  pythonProcess = spawn(backendPath, [], {
    env: {
      ...process.env,
      PORT: String(API_PORT),
      // Variables d'environnement embarquées
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
function waitForBackend(retries = 30) {
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
      req.setTimeout(1000);
      req.on('error', retry);
      req.on('timeout', () => { req.destroy(); retry(); });
      req.end();
    };

    const retry = () => {
      attempts++;
      if (attempts >= retries) {
        console.error('[Electron] ❌ Backend timeout');
        resolve(false);
      } else {
        console.log(`[Electron] ⏳ (${attempts}/${retries}) Attente backend...`);
        setTimeout(check, 1000);
      }
    };

    setTimeout(check, 1500); // Laisser le temps au .exe de démarrer
  });
}

// ── Créer la fenêtre principale ───────────────────────────────
async function createWindow() {
  // Splash screen pendant le démarrage
  const splash = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
  });
  splash.loadURL(`data:text/html,
    <body style="background:#1a1a2e;display:flex;align-items:center;
                 justify-content:center;height:100vh;margin:0;
                 font-family:sans-serif;color:white;border-radius:12px">
      <div style="text-align:center">
        <h2>DouaneGestion</h2>
        <p>Démarrage en cours...</p>
      </div>
    </body>
  `);

  const backendReady = await waitForBackend();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    title: 'DouaneGestion',
    show: false,   // Cacher jusqu'à ce que tout soit prêt
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (!backendReady) {
    dialog.showErrorBox(
      'Erreur',
      'Impossible de démarrer le backend. Relancez l\'application.'
    );
    app.quit();
    return;
  }

  const startUrl = app.isPackaged
    ? `file://${path.join(__dirname, 'renderer', 'index.html')}`
    : 'http://localhost:5173';

  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => {
    splash.destroy();
    mainWindow.show();
    mainWindow.maximize();
  });
}

// ── Cycle de vie ──────────────────────────────────────────────
app.whenReady().then(() => {
  startBackend();
  createWindow();
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
