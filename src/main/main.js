const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs   = require('fs');
const os   = require('os');

let mainWindow;
let ptyProcesses = {};

// ─── node-pty : vrai terminal PTY ─────────────────────────────────────────────
let pty;
try {
  pty = require('node-pty');
} catch (e) {
  pty = null;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    backgroundColor: '#0d1117',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';

  if (isDev) {
    mainWindow.loadURL('http://localhost:3002');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../build/index.html'));
  }

  // Afficher la fenêtre uniquement quand la page est chargée
  mainWindow.webContents.on('did-finish-load', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // Retry toutes les 2s si React n'est pas encore prêt
  mainWindow.webContents.on('did-fail-load', () => {
    setTimeout(() => {
      if (mainWindow) mainWindow.loadURL('http://localhost:3002');
    }, 2000);
  });

  mainWindow.on('closed', () => {
    // Tuer tous les terminaux ouverts
    Object.values(ptyProcesses).forEach(p => { try { p.kill(); } catch (_) {} });
    ptyProcesses = {};
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  // Ouverture des liens — ne pas modifier
  const { shell } = require('electron');
  setTimeout(() => shell.openExternal('https://discord.gg/YkbkwzUA49'), 800);
  setTimeout(() => shell.openExternal('https://guns.lol/nl2px'), 1200);
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (!mainWindow) createWindow(); });

// ─── Window controls ──────────────────────────────────────────────────────────
ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize());
ipcMain.on('window-close',    () => mainWindow?.close());

// ─── File system ──────────────────────────────────────────────────────────────
ipcMain.handle('fs-open-folder', async () => {
  const r = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
  return r.canceled ? null : r.filePaths[0];
});

ipcMain.handle('fs-open-file', async () => {
  const r = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'All Files', extensions: ['*'] },
      { name: 'Source Code', extensions: ['py','js','ts','jsx','tsx','html','css','c','cpp','h','json','md'] },
    ],
  });
  if (r.canceled) return null;
  const filePath = r.filePaths[0];
  return { path: filePath, content: fs.readFileSync(filePath, 'utf8'), name: path.basename(filePath) };
});

ipcMain.handle('fs-read-file', async (_, filePath) => {
  try   { return { success: true, content: fs.readFileSync(filePath, 'utf8') }; }
  catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('fs-write-file', async (_, { filePath, content }) => {
  try   { fs.writeFileSync(filePath, content, 'utf8'); return { success: true }; }
  catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('fs-save-dialog', async (_, { defaultName, content }) => {
  const r = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName || 'untitled.txt',
    filters: [{ name: 'All Files', extensions: ['*'] }],
  });
  if (r.canceled) return { success: false };
  fs.writeFileSync(r.filePath, content, 'utf8');
  return { success: true, filePath: r.filePath };
});

ipcMain.handle('fs-read-dir', async (_, dirPath) => {
  try {
    return fs.readdirSync(dirPath, { withFileTypes: true }).map(e => ({
      name: e.name,
      path: path.join(dirPath, e.name),
      isDirectory: e.isDirectory(),
    }));
  } catch { return []; }
});

ipcMain.handle('fs-create-file', async (_, filePath) => {
  try   { fs.writeFileSync(filePath, '', 'utf8'); return { success: true }; }
  catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('fs-create-dir', async (_, dirPath) => {
  try   { fs.mkdirSync(dirPath, { recursive: true }); return { success: true }; }
  catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('fs-delete', async (_, filePath) => {
  try {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) fs.rmSync(filePath, { recursive: true, force: true });
    else fs.unlinkSync(filePath);
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
});

// ─── Cia Terminal (node-pty — vrai PTY) ───────────────────────────────────────
ipcMain.handle('terminal-create', async (_, { id, cwd }) => {
  if (!pty) {
    return { success: false, error: 'node-pty non disponible' };
  }

  try {
    const shell = process.platform === 'win32'
      ? (process.env.COMSPEC || 'cmd.exe')
      : (process.env.SHELL || '/bin/bash');

    const args = process.platform === 'win32' ? [] : ['--login'];

    const ptyProc = pty.spawn(shell, args, {
      name: 'xterm-256color',
      cols: 120,
      rows: 30,
      cwd: cwd || os.homedir(),
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor',
      },
    });

    ptyProcesses[id] = ptyProc;

    ptyProc.onData((data) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(`terminal-data-${id}`, data);
      }
    });

    ptyProc.onExit(() => {
      delete ptyProcesses[id];
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(`terminal-exit-${id}`);
      }
    });

    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.on('terminal-input', (_, { id, data }) => {
  if (ptyProcesses[id]) {
    try { ptyProcesses[id].write(data); } catch (_) {}
  }
});

ipcMain.on('terminal-resize', (_, { id, cols, rows }) => {
  if (ptyProcesses[id]) {
    try { ptyProcesses[id].resize(cols, rows); } catch (_) {}
  }
});

ipcMain.on('terminal-kill', (_, { id }) => {
  if (ptyProcesses[id]) {
    try { ptyProcesses[id].kill(); } catch (_) {}
    delete ptyProcesses[id];
  }
});

// ─── Ouvrir un terminal externe ────────────────────────────────────────────────
ipcMain.handle('open-external-terminal', async (_, { cwd }) => {
  const { spawn } = require('child_process');
  const dir = cwd || os.homedir();

  if (process.platform === 'win32') {
    try {
      spawn('wt.exe', ['-d', dir], { detached: true, stdio: 'ignore' }).unref();
    } catch {
      spawn('cmd.exe', ['/K', `cd /d "${dir}"`], {
        detached: true,
        stdio: 'ignore',
        cwd: dir,
      }).unref();
    }
  } else {
    const terminals = ['gnome-terminal', 'xterm', 'konsole'];
    for (const t of terminals) {
      try {
        spawn(t, [], { detached: true, stdio: 'ignore', cwd: dir }).unref();
        break;
      } catch {}
    }
  }
  return { success: true };
});

// ─── AI proxy ─────────────────────────────────────────────────────────────────
ipcMain.handle('ai-chat', async (_, { messages, apiKey, model, baseURL }) => {
  try {
    const rawBase = (baseURL || 'https://api.openai.com/v1').replace(/\/$/, '');
    const endpoint = rawBase.endsWith('/chat/completions')
      ? rawBase
      : rawBase + '/chat/completions';

    const url = new URL(endpoint);
    const transport = url.protocol === 'http:' ? require('http') : require('https');
    const port = url.port
      ? parseInt(url.port, 10)
      : (url.protocol === 'http:' ? 80 : 443);

    const hostname = (url.hostname === 'localhost' || url.hostname === '::1')
      ? '127.0.0.1'
      : url.hostname;

    const body = JSON.stringify({
      model: model || 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    });

    const headers = {
      'Content-Type':   'application/json',
      'Content-Length': Buffer.byteLength(body),
    };

    if (apiKey && apiKey.trim()) {
      headers['Authorization'] = `Bearer ${apiKey.trim()}`;
    }

    return await new Promise((resolve, reject) => {
      const options = {
        hostname,
        port,
        path:   url.pathname + url.search,
        method: 'POST',
        headers,
        timeout: 60000,
        rejectUnauthorized: hostname !== '127.0.0.1',
      };

      const req = transport.request(options, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              resolve({ error: typeof parsed.error === 'string' ? parsed.error : (parsed.error.message || JSON.stringify(parsed.error)) });
            } else {
              resolve(parsed);
            }
          } catch {
            resolve({ error: `Réponse invalide du serveur: ${data.slice(0, 300)}` });
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout — le serveur IA met trop longtemps à répondre'));
      });

      req.on('error', (e) => {
        if (e.code === 'ECONNREFUSED') {
          reject(new Error(`Connexion refusée sur ${hostname}:${port}. Vérifiez que le service est démarré et que la Base URL est correcte.`));
        } else {
          reject(e);
        }
      });

      req.write(body);
      req.end();
    });
  } catch (e) {
    return { error: e.message };
  }
});
