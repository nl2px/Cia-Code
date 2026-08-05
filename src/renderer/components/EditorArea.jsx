import React, { useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { registerCiaDarkTheme } from '../monacoTheme';
import '../styles/EditorArea.css';

const LANG_MAP = {
  js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
  py: 'python', html: 'html', css: 'css', json: 'json',
  c: 'c', cpp: 'cpp', h: 'c', md: 'markdown', sh: 'shell',
  rs: 'rust', go: 'go', java: 'java', rb: 'ruby', php: 'php',
  xml: 'xml', yaml: 'yaml', yml: 'yaml', sql: 'sql', txt: 'plaintext',
};

function getLanguage(filename) {
  const ext = (filename || '').split('.').pop().toLowerCase();
  return LANG_MAP[ext] || 'plaintext';
}

function TabBar({ files, activeFile, onSelect, onClose }) {
  return (
    <div className="tab-bar">
      {files.map(file => (
        <div
          key={file.path}
          className={`tab ${activeFile?.path === file.path ? 'tab-active' : ''}`}
          onClick={() => onSelect(file)}
        >
          <span className="tab-lang-dot" data-lang={getLanguage(file.name)} />
          <span className="tab-name">{file.name}</span>
          {!file.saved && <span className="tab-unsaved">●</span>}
          <button
            className="tab-close"
            onClick={e => { e.stopPropagation(); onClose(file.path); }}
          >✕</button>
        </div>
      ))}
    </div>
  );
}

export default function EditorArea({ files, activeFile, onSelectFile, onCloseFile, onChangeContent, onSave, onNewFile }) {
  const editorRef = useRef(null);

  // Ctrl+S to save
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSave(activeFile);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeFile, onSave]);

  const handleEditorWillMount = useCallback((monacoInstance) => {
    registerCiaDarkTheme(monacoInstance);
  }, []);

  const handleEditorDidMount = useCallback((editor) => {
    editorRef.current = editor;
    editor.addAction({
      id: 'cia-save',
      label: 'Cia: Save File',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      run: () => onSave(activeFile),
    });
  }, [activeFile, onSave]);

  if (files.length === 0) {
    return (
      <div className="editor-empty">
        <div className="welcome">
          <div className="welcome-logo">⬡</div>
          <h1>Cia Code</h1>
          <p>IDE IA nouvelle génération</p>
          <div className="welcome-actions">
            <button onClick={onNewFile}>＋ Nouveau fichier</button>
          </div>
          <div className="welcome-tips">
            <div className="tip"><kbd>Ctrl</kbd>+<kbd>S</kbd> Sauvegarder</div>
            <div className="tip"><kbd>Ctrl</kbd>+<kbd>Z</kbd> Annuler</div>
            <div className="tip"><span>🤖</span> IA illimitée sur le panneau droit</div>
            <div className="tip"><span>▶</span> Cia Terminal intégré</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-area">
      <TabBar
        files={files}
        activeFile={activeFile}
        onSelect={onSelectFile}
        onClose={onCloseFile}
      />
      {activeFile && (
        <div className="editor-wrapper">
          <Editor
            key={activeFile.path}
            height="100%"
            language={getLanguage(activeFile.name)}
            value={activeFile.content}
            theme="cia-dark"
            beforeMount={handleEditorWillMount}
            onMount={handleEditorDidMount}
            onChange={(val) => onChangeContent(activeFile.path, val || '')}
            options={{
              fontSize: 14,
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              fontLigatures: true,
              lineNumbers: 'on',
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              renderWhitespace: 'selection',
              bracketPairColorization: { enabled: true },
              guides: { bracketPairs: true },
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              padding: { top: 12 },
              suggest: { preview: true },
              inlineSuggest: { enabled: true },
            }}
          />
        </div>
      )}
    </div>
  );
}
