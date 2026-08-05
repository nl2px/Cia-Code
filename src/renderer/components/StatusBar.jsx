import React from 'react';
import '../styles/StatusBar.css';

const LANG_LABELS = {
  js: 'JavaScript', jsx: 'JavaScript (JSX)', ts: 'TypeScript', tsx: 'TypeScript (TSX)',
  py: 'Python', html: 'HTML', css: 'CSS', json: 'JSON',
  c: 'C', cpp: 'C++', h: 'C/C++ Header', md: 'Markdown',
  sh: 'Shell', rs: 'Rust', go: 'Go', java: 'Java',
  rb: 'Ruby', php: 'PHP', sql: 'SQL', txt: 'Texte brut',
};

export default function StatusBar({ activeFile, explorerRoot }) {
  const ext  = activeFile?.name?.split('.').pop().toLowerCase() || '';
  const lang = LANG_LABELS[ext] || (ext ? ext.toUpperCase() : 'Texte brut');
  const lines = activeFile?.content?.split('\n').length || 0;

  return (
    <div className="status-bar">
      <div className="status-left">
        <span className="status-item brand">⬡ Cia Code</span>
        {explorerRoot && (
          <span className="status-item folder">📁 {explorerRoot.split(/[\\/]/).pop()}</span>
        )}
      </div>
      <div className="status-right">
        {activeFile && (
          <>
            <span className="status-item">{lines} lignes</span>
            <span className="status-item lang">{lang}</span>
            <span className={`status-item saved ${activeFile.saved ? 'ok' : 'unsaved'}`}>
              {activeFile.saved ? '● Sauvegardé' : '● Non sauvegardé'}
            </span>
          </>
        )}
        <span className="status-item">UTF-8</span>
        <span className="status-item">LF</span>
      </div>
    </div>
  );
}
