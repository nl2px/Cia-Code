/**
 * Script de démarrage Cia Code
 * Lance React puis attend qu'il soit prêt avant de démarrer Electron
 */
const { spawn } = require('child_process');
const waitOn = require('wait-on');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

console.log('🚀 Démarrage de Cia Code...');
console.log('⚛️  Lancement de React...');

// Lancer le serveur React
const reactProcess = spawn(npmCmd, ['run', 'react-start'], {
  stdio: 'inherit',
  shell: true,
});

reactProcess.on('error', (err) => {
  console.error('Erreur React:', err);
  process.exit(1);
});

// Attendre que React soit disponible sur le port 3000
waitOn({ resources: ['http://localhost:3002'], timeout: 60000 })
  .then(() => {
    console.log('✅ React prêt — Lancement d\'Electron...');

    const electronPath = require('electron');
    const electronProcess = spawn(electronPath, ['.'], {
      stdio: 'inherit',
      env: { ...process.env },
    });

    electronProcess.on('error', (err) => {
      console.error('Erreur Electron:', err);
    });

    electronProcess.on('close', (code) => {
      console.log('Electron fermé, arrêt de React...');
      reactProcess.kill();
      process.exit(code);
    });
  })
  .catch((err) => {
    console.error('React n\'a pas démarré à temps:', err.message);
    reactProcess.kill();
    process.exit(1);
  });

process.on('SIGINT', () => {
  reactProcess.kill();
  process.exit(0);
});
