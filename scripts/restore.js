/**
 * restore.js
 * Restaure les fichiers originaux depuis src/_originals/
 * à utiliser APRÈS le build pour reprendre le développement.
 *
 * Usage : node scripts/restore.js
 */

const fs   = require('fs');
const path = require('path');

const ROOT       = path.join(__dirname, '..');
const SRC_DIR    = path.join(ROOT, 'src');
const BACKUP_DIR = path.join(ROOT, 'src', '_originals');

function getAllFiles(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) getAllFiles(fullPath, results);
    else if (entry.isFile()) results.push(fullPath);
  }
  return results;
}

function main() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('❌ Aucun backup trouvé dans src/_originals/');
    console.log('   Lance d\'abord "npm run obfuscate" pour créer les backups.');
    process.exit(1);
  }

  console.log('\n🔓 Restauration du code source original...\n');

  const files = getAllFiles(BACKUP_DIR);
  let restored = 0;

  for (const backupPath of files) {
    const relPath    = path.relative(BACKUP_DIR, backupPath);
    const destPath   = path.join(SRC_DIR, relPath);
    const destFolder = path.dirname(destPath);

    try {
      if (!fs.existsSync(destFolder)) fs.mkdirSync(destFolder, { recursive: true });
      fs.writeFileSync(destPath, fs.readFileSync(backupPath, 'utf8'), 'utf8');
      console.log(`  ✅ ${relPath}`);
      restored++;
    } catch (err) {
      console.error(`  ❌ ${relPath} : ${err.message}`);
    }
  }

  console.log(`\n✨ ${restored} fichier(s) restauré(s).\n`);
}

main();
