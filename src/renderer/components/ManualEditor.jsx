import React, { useState, useRef } from 'react';
import '../styles/ManualEditor.css';

const TEMPLATES = {
  python: `# Mon script Python
def main():
    print("Hello depuis Cia Code !")

if __name__ == "__main__":
    main()
`,
  javascript: `// Mon script JavaScript
function main() {
  console.log("Hello depuis Cia Code !");
}

main();
`,
  html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Ma page</title>
</head>
<body>
  <h1>Hello depuis Cia Code !</h1>
</body>
</html>
`,
  css: `/* Mon style CSS */
body {
  font-family: sans-serif;
  background: #0d1117;
  color: #e6edf3;
  margin: 0;
  padding: 20px;
}

h1 {
  color: #58a6ff;
}
`,
  c: `#include <stdio.h>

int main() {
    printf("Hello depuis Cia Code !\\n");
    return 0;
}
`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello depuis Cia Code !" << endl;
    return 0;
}
`,
  blank: '',
};

const EXT_MAP = {
  python: 'py', javascript: 'js', html: 'html',
  css: 'css', c: 'c', cpp: 'cpp', blank: 'txt',
};

export default function ManualEditor({ onOpenInEditor }) {
  const [show, setShow]         = useState(false);
  const [lang, setLang]         = useState('python');
  const [filename, setFilename] = useState('');
  const [code, setCode]         = useState(TEMPLATES.python);
  const textRef = useRef(null);

  const handleLangChange = (l) => {
    setLang(l);
    setCode(TEMPLATES[l]);
  };

  const handleCreate = async () => {
    const name = filename.trim() || `nouveau.${EXT_MAP[lang]}`;
    const finalName = name.includes('.') ? name : `${name}.${EXT_MAP[lang]}`;

    // Sauvegarder via dialog
    const result = await window.cia.saveDialog(finalName, code);
    if (result.success) {
      setShow(false);
      // Ouvrir dans l'éditeur principal
      onOpenInEditor(result.filePath, finalName, code);
    }
  };

  // Tab key → insérer 2 espaces
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const el  = textRef.current;
      const s   = el.selectionStart;
      const end = el.selectionEnd;
      const next = code.substring(0, s) + '  ' + code.substring(end);
      setCode(next);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = s + 2;
      });
    }
  };

  if (!show) {
    return (
      <button className="manual-open-btn" onClick={() => setShow(true)} title="Créer un fichier manuellement">
        ✏️ Nouveau fichier manuel
      </button>
    );
  }

  return (
    <div className="manual-overlay">
      <div className="manual-modal">
        <div className="manual-header">
          <span className="manual-title">✏️ Éditeur Manuel</span>
          <button className="manual-close" onClick={() => setShow(false)}>✕</button>
        </div>

        {/* Nom du fichier */}
        <div className="manual-row">
          <label>Nom du fichier</label>
          <input
            placeholder={`nouveau.${EXT_MAP[lang]}`}
            value={filename}
            onChange={e => setFilename(e.target.value)}
          />
        </div>

        {/* Choix du langage */}
        <div className="manual-langs">
          {Object.keys(TEMPLATES).map(l => (
            <button
              key={l}
              className={`lang-btn ${lang === l ? 'active' : ''}`}
              onClick={() => handleLangChange(l)}
            >
              {l === 'blank' ? '📄 Vide' :
               l === 'python' ? '🐍 Python' :
               l === 'javascript' ? '🟨 JS' :
               l === 'html' ? '🟧 HTML' :
               l === 'css' ? '🎨 CSS' :
               l === 'c' ? '🔵 C' : '🔵 C++'}
            </button>
          ))}
        </div>

        {/* Zone de code */}
        <div className="manual-editor-wrap">
          <div className="line-numbers">
            {code.split('\n').map((_, i) => (
              <span key={i}>{i + 1}</span>
            ))}
          </div>
          <textarea
            ref={textRef}
            className="manual-textarea"
            value={code}
            onChange={e => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
          />
        </div>

        <div className="manual-footer">
          <span className="manual-stats">{code.split('\n').length} lignes · {code.length} caractères</span>
          <div className="manual-actions">
            <button className="btn-cancel" onClick={() => setShow(false)}>Annuler</button>
            <button className="btn-create" onClick={handleCreate}>
              💾 Créer et ouvrir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
