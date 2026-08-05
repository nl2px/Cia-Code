import React, { useState, useCallback, useRef, useEffect } from 'react';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import EditorArea from './components/EditorArea';
import AIPanel from './components/AIPanel';
import CiaTerminal from './components/CiaTerminal';
import StatusBar from './components/StatusBar';
import SplashScreen from './components/SplashScreen';
import ManualEditor from './components/ManualEditor';
import './styles/global.css';

export default function App() {
  const [splashDone,    setSplashDone]    = useState(false);
  const [openFiles,     setOpenFiles]     = useState([]);
  const [activeFile,    setActiveFile]    = useState(null);
  const [explorerRoot,  setExplorerRoot]  = useState(null);
  const explorerRootRef = useRef(null);
  // Garder la ref synchronisée avec le state
  useEffect(() => { explorerRootRef.current = explorerRoot; }, [explorerRoot]);
  const [showAI,        setShowAI]        = useState(true);
  const [showTerminal,  setShowTerminal]  = useState(false);
  const [aiMessages,    setAiMessages]    = useState([]);
  const [sidebarWidth,  setSidebarWidth]  = useState(240);
  const [aiWidth,       setAiWidth]       = useState(340);
  const [termHeight,    setTermHeight]    = useState(260);

  // ── Ouvrir un fichier dans l'éditeur ────────────────────────────────────────
  const openFileInEditor = useCallback(async (filePath, fileName, content = null) => {
    const existing = openFiles.find(f => f.path === filePath);
    if (existing) { setActiveFile(existing); return; }
    let fileContent = content;
    if (fileContent === null) {
      const result = await window.cia.readFile(filePath);
      if (!result.success) return;
      fileContent = result.content;
    }
    const newFile = { path: filePath, name: fileName, content: fileContent, saved: true };
    setOpenFiles(prev => [...prev, newFile]);
    setActiveFile(newFile);
  }, [openFiles]);

  // ── Mettre à jour le contenu d'un fichier ───────────────────────────────────
  const updateFileContent = useCallback((path, content) => {
    setOpenFiles(prev => prev.map(f => f.path === path ? { ...f, content, saved: false } : f));
    setActiveFile(prev => prev?.path === path ? { ...prev, content, saved: false } : prev);
  }, []);

  // ── Sauvegarder un fichier ───────────────────────────────────────────────────
  const saveFile = useCallback(async (file) => {
    if (!file) return;
    if (!file.path || file.path.startsWith('untitled-')) {
      const result = await window.cia.saveDialog(file.name, file.content);
      if (!result.success) return;
      const saved = { ...file, path: result.filePath, name: result.filePath.split(/[\\/]/).pop(), saved: true };
      setOpenFiles(prev => prev.map(f => f.path === file.path ? saved : f));
      setActiveFile(saved);
    } else {
      await window.cia.writeFile(file.path, file.content);
      setOpenFiles(prev => prev.map(f => f.path === file.path ? { ...f, saved: true } : f));
      setActiveFile(prev => prev?.path === file.path ? { ...prev, saved: true } : prev);
    }
  }, []);

  // ── Fermer un onglet ─────────────────────────────────────────────────────────
  const closeFile = useCallback((path) => {
    setOpenFiles(prev => {
      const idx  = prev.findIndex(f => f.path === path);
      const next = prev.filter(f => f.path !== path);
      if (activeFile?.path === path) setActiveFile(next[Math.min(idx, next.length - 1)] || null);
      return next;
    });
  }, [activeFile]);

  // ── Nouveau fichier vide ─────────────────────────────────────────────────────
  const newFile = useCallback(() => {
    const id   = `untitled-${Date.now()}`;
    const file = { path: id, name: 'untitled.txt', content: '', saved: false };
    setOpenFiles(prev => [...prev, file]);
    setActiveFile(file);
  }, []);

  // ── Ouvrir un dossier ────────────────────────────────────────────────────────
  const openFolder = useCallback(async () => {
    const folder = await window.cia.openFolder();
    if (folder) {
      setExplorerRoot(folder);
      explorerRootRef.current = folder;
    }
  }, []);

  // ── Créer fichier depuis l'IA — AUTOMATIQUE, zéro dialog ────────────────────
  // Utilise une ref pour le dossier afin d'éviter les stale closures lors de
  // créations multiples en séquence rapide
  const handleCreateFile = useCallback(async (filename, code) => {
    // Lire depuis la ref — toujours à jour même dans une boucle async
    let dirPath = explorerRootRef.current;

    if (!dirPath) {
      // Demander un dossier une seule fois
      dirPath = await window.cia.openFolder();
      if (!dirPath) return;
      explorerRootRef.current = dirPath;
      setExplorerRoot(dirPath);
    }

    const sep      = dirPath.includes('/') ? '/' : '\\';
    const filePath = dirPath + sep + filename;

    // Écrire sur disque
    await window.cia.writeFile(filePath, code);

    // Ajouter l'onglet — setter fonctionnel pour ne pas dépendre du state actuel
    const newFile = { path: filePath, name: filename, content: code, saved: true };
    setOpenFiles(prev => {
      if (prev.find(f => f.path === filePath)) {
        return prev.map(f => f.path === filePath ? newFile : f);
      }
      return [...prev, newFile];
    });
    setActiveFile(newFile);
  }, []); // deps vides — on lit tout depuis les refs

  // ── Éditeur manuel ───────────────────────────────────────────────────────────
  const handleManualFileCreated = useCallback((filePath, fileName, content) => {
    openFileInEditor(filePath, fileName, content);
  }, [openFileInEditor]);

  // ── Splash screen ────────────────────────────────────────────────────────────
  if (!splashDone) {
    return <SplashScreen onDone={() => setSplashDone(true)} />;
  }

  return (
    <div className="app">
      <TitleBar
        onMinimize={() => window.cia.minimize()}
        onMaximize={() => window.cia.maximize()}
        onClose={() => window.cia.close()}
        onNewFile={newFile}
        onOpenFolder={openFolder}
        onSave={() => saveFile(activeFile)}
        onToggleAI={() => setShowAI(v => !v)}
        onToggleTerminal={() => setShowTerminal(v => !v)}
        showAI={showAI}
        showTerminal={showTerminal}
        manualEditorSlot={<ManualEditor onOpenInEditor={handleManualFileCreated} />}
      />

      <div className="workspace">
        <Sidebar
          root={explorerRoot}
          onOpenFile={openFileInEditor}
          onOpenFolder={openFolder}
          width={sidebarWidth}
          onResize={setSidebarWidth}
        />

        <div className="center-col">
          <EditorArea
            files={openFiles}
            activeFile={activeFile}
            onSelectFile={setActiveFile}
            onCloseFile={closeFile}
            onChangeContent={updateFileContent}
            onSave={saveFile}
            onNewFile={newFile}
          />

          {showTerminal && (
            <CiaTerminal
              height={termHeight}
              onResize={setTermHeight}
              cwd={explorerRoot}
              onClose={() => setShowTerminal(false)}
            />
          )}
        </div>

        {showAI && (
          <AIPanel
            width={aiWidth}
            onResize={setAiWidth}
            messages={aiMessages}
            onMessages={setAiMessages}
            activeFile={activeFile}
            explorerRoot={explorerRoot}
            onCreateFile={handleCreateFile}
            onInsertCode={(code) => {
              if (!activeFile) return;
              updateFileContent(activeFile.path, activeFile.content + '\n' + code);
            }}
            onRunCommand={(cmd) => {
              if (!showTerminal) setShowTerminal(true);
              window.dispatchEvent(new CustomEvent('cia-run-command', { detail: cmd }));
            }}
          />
        )}
      </div>

      <StatusBar activeFile={activeFile} explorerRoot={explorerRoot} />
    </div>
  );
}
