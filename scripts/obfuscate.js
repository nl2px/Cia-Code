/**
 * obfuscate.js
 * Obfusque les fichiers du main process (src/main/ + src/index.js).
 *
 * Note : src/renderer/ n'a PAS besoin d'obfuscation manuelle —
 * react-scripts build le compile, minifie et bundle déjà en un seul
 * fichier illisible dans build/static/js/. Le résultat final dans
 * l'asar est donc déjà protégé.
 *
 * Les originaux sont sauvegardés dans src/_originals/.
 */

const JavaScriptObfuscator = require('javascript-obfuscator');
const fs   = require('fs');
const path = require('path');

const ROOT       = path.join(__dirname, '..');
const SRC_DIR    = path.join(ROOT, 'src');
const MAIN_DIR   = path.join(ROOT, 'src', 'main');
const BACKUP_DIR = path.join(ROOT, 'src', '_originals');

// ─── Fichiers ciblés ─────────────────────────────────────────────────────────
// Uniquement le main process Node.js (pas le renderer)
const TARGET_FILES = [
  path.join(SRC_DIR, 'index.js'),
  ...getAllJsFiles(MAIN_DIR),
];

// ─── Options obfuscation (cible Node.js) ─────────────────────────────────────
const OPTIONS = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  debugProtection: false,
  disableConsoleOutput: false,
  identifierNamesGenerator: 'hexadecimal',
  log: false,
  numbersToExpressions: true,
  renameGlobals: false,
  selfDefending: true,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 8,
  stringArray: true,
  stringArrayCallsTransform: true,
  stringArrayEncoding: ['base64'],
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 2,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersParametersMaxCount: 4,
  stringArrayWrappersType: 'function',
  stringArrayThreshold: 0.75,
  unicodeEscapeSequence: false,
  target: 'node',
};

// ─── Utilitaires ─────────────────────────────────────────────────────────────
function getAllJsFiles(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== '_originals') {
      getAllJsFiles(fullPath, results);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      results.push(fullPath);
    }
  }
  return results;
}

function processFile(filePath, stats) {
  if (!fs.existsSync(filePath)) return;

  const relPath      = path.relative(SRC_DIR, filePath);
  const backupPath   = path.join(BACKUP_DIR, relPath);
  const backupFolder = path.dirname(backupPath);

  try {
    const original = fs.readFileSync(filePath, 'utf8');

    // Sauvegarder l'original (une seule fois)
    if (!fs.existsSync(backupFolder)) fs.mkdirSync(backupFolder, { recursive: true });
    if (!fs.existsSync(backupPath)) {
      fs.writeFileSync(backupPath, original, 'utf8');
      console.log(`  💾 Sauvegardé : ${relPath}`);
    }

    const result  = JavaScriptObfuscator.obfuscate(original, OPTIONS);
    const obfCode = result.getObfuscatedCode();
    fs.writeFileSync(filePath, obfCode, 'utf8');

    const kb1 = (Buffer.byteLength(original, 'utf8') / 1024).toFixed(1);
    const kb2 = (Buffer.byteLength(obfCode,   'utf8') / 1024).toFixed(1);
    console.log(`  ✅ ${relPath} (${kb1}KB → ${kb2}KB)`);
    stats.success++;
  } catch (err) {
    console.error(`  ❌ ${relPath} : ${err.message}`);
    stats.failed++;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function main() {
  console.log('\n🔒 Obfuscation du main process...\n');

  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const stats = { success: 0, failed: 0 };

  for (const filePath of TARGET_FILES) {
    processFile(filePath, stats);
  }

  console.log(`\n📦 Terminé : ${stats.success} fichier(s) protégé(s)${stats.failed > 0 ? `, ${stats.failed} erreur(s)` : ''}`);
  console.log('💡 Le renderer est protégé par react-scripts build (bundle minifié).');
  console.log('💡 Originaux dans src/_originals/ — lance "node scripts/restore.js" après le build.\n');

  if (stats.failed > 0) process.exit(1);
}

main();
