/**
 * restore-bat.js
 * Restaure les .bat originaux depuis bat_originals/
 *
 * Usage : node scripts/restore-bat.js
 */

const fs   = require('fs');
const path = require('path');

const ROOT       = path.join(__dirname, '..');
const BACKUP_DIR = path.join(ROOT, 'bat_originals');

function main() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('❌ Aucun backup trouvé dans bat_originals/');
    process.exit(1);
  }

  console.log('\n🔓 Restauration des .bat originaux...\n');

  const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.bat'));
  let restored = 0;

  for (const filename of files) {
    const backupPath = path.join(BACKUP_DIR, filename);
    const destPath   = path.join(ROOT, filename);
    try {
      fs.writeFileSync(destPath, fs.readFileSync(backupPath, 'utf8'), 'utf8');
      console.log(`  ✅ ${filename}`);
      restored++;
    } catch (err) {
      console.error(`  ❌ ${filename} : ${err.message}`);
    }
  }

  console.log(`\n✨ ${restored} fichier(s) restauré(s).\n`);
}

main();
