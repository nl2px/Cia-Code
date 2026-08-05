/**
 * obfuscate-bat.js
 * Protège les fichiers .bat en encodant leur contenu en base64.
 *
 * Méthode fiable :
 *  - Le wrapper capture son propre dossier dans _DIR
 *  - PowerShell décode le payload dans un fichier temp
 *  - On SET _DIR dans l'environnement courant (pas setlocal)
 *  - On utilise CALL pour exécuter le temp (hérite des variables)
 *  - Le payload utilise %_DIR% (expansion normale, pas delayed)
 *
 * Les originaux sont sauvegardés dans bat_originals/
 */

const fs   = require('fs');
const path = require('path');

const ROOT       = path.join(__dirname, '..');
const BACKUP_DIR = path.join(ROOT, 'bat_originals');

const BAT_FILES = ['CiaCode.bat', 'Lance-CiaCode.bat', 'debug.bat'];
const MARKER    = '::OBF';

function isObfuscated(content) {
  return content.trimStart().startsWith(MARKER);
}

function obfuscateBat(filename) {
  const filePath   = path.join(ROOT, filename);
  const backupPath = path.join(BACKUP_DIR, filename);

  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠️  ${filename} introuvable, ignoré.`);
    return;
  }

  const current = fs.readFileSync(filePath, 'utf8');

  let original;
  if (isObfuscated(current)) {
    if (!fs.existsSync(backupPath)) {
      console.error(`  ❌ ${filename} déjà obfusqué mais pas de backup !`);
      return;
    }
    original = fs.readFileSync(backupPath, 'utf8');
  } else {
    original = current;
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
    fs.writeFileSync(backupPath, original, 'utf8');
    console.log(`  💾 Sauvegardé : ${filename}`);
  }

  // Dans le payload, remplacer toutes les références à %~dp0 et !_DIR!
  // par %_DIR% (expansion simple qui fonctionne via héritage de variables)
  const patched = original
    .replace(/setlocal enabledelayedexpansion\r?\n/gi, '')
    .replace(/setlocal\r?\n/gi, '')
    .replace(/endlocal\r?\n?/gi, '')
    .replace(/set "_DIR=%~dp0"\r?\n/g, '')
    .replace(/set "_DIR=!_DIR!"\r?\n/g, '')
    .replace(/cd \/d "%~dp0"\r?\n/g, 'cd /d "%_DIR%"\r\n')
    .replace(/cd \/d "!_DIR!"\r?\n/g, 'cd /d "%_DIR%"\r\n')
    .replace(/!_DIR!/g, '%_DIR%')
    .replace(/%~dp0/g, '%_DIR%');

  // Encoder en base64
  const b64 = Buffer.from(patched, 'utf8').toString('base64');

  // Découper en chunks de 150 chars
  const chunkSize = 150;
  const chunks = [];
  for (let i = 0; i < b64.length; i += chunkSize) {
    chunks.push(b64.slice(i, i + chunkSize));
  }

  // Générer le bat obfusqué
  const lines = [
    MARKER,
    '@echo off',
    // Capturer le vrai dossier (avant tout setlocal)
    'set "_DIR=%~dp0"',
    'setlocal enabledelayedexpansion',
    'set "_p="',
  ];

  for (const chunk of chunks) {
    lines.push(`set "_p=!_p!${chunk}"`);
  }

  lines.push(
    'set "_r=%random%%random%"',
    'set "_t=!_DIR!~cr!_r!.bat"',
    // Décoder base64 → fichier temp dans le dossier du projet
    'powershell -NoP -NonI -C "$b=[Convert]::FromBase64String(\'!_p!\');[IO.File]::WriteAllText(\'!_t!\',[Text.Encoding]::UTF8.GetString($b))"',
    'if not exist "!_t!" (echo [ERREUR] Decodage echoue & pause & exit /b 1)',
    // endlocal pour que _DIR soit visible par le call
    // endlocal en préservant _DIR et _t pour le call
    'endlocal & set "_DIR=%_DIR%" & set "_t=!_t!"',
    // call hérite de _DIR dans l'environnement
    'call "%_t%"',
    'del /f /q "%_t%" 2>nul',
  );

  const obfuscated = lines.join('\r\n') + '\r\n';
  fs.writeFileSync(filePath, obfuscated, 'utf8');

  const kb1 = (Buffer.byteLength(original, 'utf8') / 1024).toFixed(1);
  const kb2 = (Buffer.byteLength(obfuscated, 'utf8') / 1024).toFixed(1);
  console.log(`  ✅ ${filename} (${kb1}KB → ${kb2}KB)`);
}

function main() {
  console.log('\n🔒 Obfuscation des fichiers .bat...\n');
  for (const f of BAT_FILES) obfuscateBat(f);
  console.log('\n📦 Terminé.');
  console.log('💡 Originaux dans bat_originals/ — "node scripts/restore-bat.js" pour restaurer.\n');
}

main();
