import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../styles/Sidebar.css';

const FILE_ICONS = {
  js: '🟨', jsx: '⚛️', ts: '🔷', tsx: '⚛️',
  py: '🐍', html: '🟧', css: '🎨', json: '📋',
  c: '🔵', cpp: '🔵', h: '🔵', md: '📝',
  sh: '⚙️', rs: '🦀', go: '🐹', java: '☕',
  txt: '📄', png: '🖼️', jpg: '🖼️', gif: '🖼️',
  svg: '🖼️', mp4: '🎬', mp3: '🎵', zip: '📦',
  pdf: '📕',
};

function getIcon(name, isDir) {
  if (isDir) return null;
  const ext = name.split('.').pop().toLowerCase();
  return FILE_ICONS[ext] || '📄';
}

function FileEntry({ entry, depth = 0, onOpenFile, onRefresh, currentRoot }) {
  const [expanded, setExpanded]   = useState(false);
  const [children, setChildren]   = useState([]);
  const [renaming, setRenaming]   = useState(false);
  const [newName, setNewName]     = useState(entry.name);
  const [ctxMenu, setCtxMenu]     = useState(null);
  const inputRef = useRef(null);

  const loadChildren = useCallback(async () => {
    const items = await window.cia.readDir(entry.path);
    items.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
    setChildren(items);
  }, [entry.path]);

  const toggle = async () => {
    if (!entry.isDirectory) {
      onOpenFile(entry.path, entry.name);
      return;
    }
    if (!expanded) await loadChildren();
    setExpanded(v => !v);
  };

  const handleCtx = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({ x: e.clientX, y: e.clientY });
  };

  const closeCtx = () => setCtxMenu(null);

  const handleDelete = async () => {
    closeCtx();
    await window.cia.deleteEntry(entry.path);
    onRefresh();
  };

  const handleNewFile = async () => {
    closeCtx();
    const name = prompt('Nom du fichier:');
    if (!name) return;
    const p = entry.isDirectory ? `${entry.path}\\${name}` : `${entry.path.replace(/[^\\/]+$/, '')}${name}`;
    await window.cia.createFile(p);
    onRefresh();
  };

  const handleNewFolder = async () => {
    closeCtx();
    const name = prompt('Nom du dossier:');
    if (!name) return;
    const p = entry.isDirectory ? `${entry.path}\\${name}` : `${entry.path.replace(/[^\\/]+$/, '')}${name}`;
    await window.cia.createDir(p);
    onRefresh();
  };

  useEffect(() => {
    if (renaming && inputRef.current) inputRef.current.focus();
  }, [renaming]);

  useEffect(() => {
    if (expanded) loadChildren();
  }, []);  // reload on mount if needed

  return (
    <>
      <div
        className={`file-entry ${entry.isDirectory ? 'dir' : 'file'}`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        onClick={toggle}
        onContextMenu={handleCtx}
      >
        <span className="entry-arrow">
          {entry.isDirectory ? (expanded ? '▾' : '▸') : ' '}
        </span>
        <span className="entry-icon">
          {entry.isDirectory ? (expanded ? '📂' : '📁') : getIcon(entry.name)}
        </span>
        {renaming ? (
          <input
            ref={inputRef}
            className="rename-input"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onBlur={() => setRenaming(false)}
            onKeyDown={e => { if (e.key === 'Enter') setRenaming(false); }}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className="entry-name">{entry.name}</span>
        )}
      </div>

      {entry.isDirectory && expanded && (
        <div className="children">
          {children.map(child => (
            <FileEntry
              key={child.path}
              entry={child}
              depth={depth + 1}
              onOpenFile={onOpenFile}
              onRefresh={async () => { await loadChildren(); onRefresh(); }}
              currentRoot={currentRoot}
            />
          ))}
        </div>
      )}

      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x} y={ctxMenu.y}
          onClose={closeCtx}
          onDelete={handleDelete}
          onNewFile={handleNewFile}
          onNewFolder={handleNewFolder}
          onRename={() => { setRenaming(true); closeCtx(); }}
        />
      )}
    </>
  );
}

function ContextMenu({ x, y, onClose, onDelete, onNewFile, onNewFolder, onRename }) {
  useEffect(() => {
    const handler = () => onClose();
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [onClose]);

  return (
    <div className="ctx-menu" style={{ left: x, top: y }}>
      <div className="ctx-item" onClick={onNewFile}>＋ Nouveau fichier</div>
      <div className="ctx-item" onClick={onNewFolder}>📁 Nouveau dossier</div>
      <div className="ctx-sep" />
      <div className="ctx-item" onClick={onRename}>✏️ Renommer</div>
      <div className="ctx-item danger" onClick={onDelete}>🗑️ Supprimer</div>
    </div>
  );
}

export default function Sidebar({ root, onOpenFile, onOpenFolder, width, onResize }) {
  const [entries, setEntries]   = useState([]);
  const [refreshKey, setRefresh] = useState(0);
  const dragRef = useRef(null);

  useEffect(() => {
    if (!root) return;
    window.cia.readDir(root).then(items => {
      items.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
      setEntries(items);
    });
  }, [root, refreshKey]);

  // Resizable sidebar
  const startDrag = (e) => {
    dragRef.current = e.clientX;
    const onMove = (ev) => onResize(Math.max(160, Math.min(500, width + ev.clientX - dragRef.current)));
    const onUp   = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div className="sidebar" style={{ width }}>
      <div className="sidebar-header">
        <span>EXPLORATEUR</span>
        <button className="sb-btn" onClick={onOpenFolder} title="Ouvrir dossier">📂</button>
        <button className="sb-btn" onClick={() => setRefresh(v => v + 1)} title="Rafraîchir">↺</button>
      </div>

      <div className="sidebar-tree">
        {!root && (
          <div className="sidebar-empty">
            <p>Aucun dossier ouvert</p>
            <button onClick={onOpenFolder}>Ouvrir un dossier</button>
          </div>
        )}
        {root && (
          <div className="root-label">
            <span>📁</span>
            <span>{root.split(/[\\/]/).pop()}</span>
          </div>
        )}
        {entries.map(entry => (
          <FileEntry
            key={entry.path}
            entry={entry}
            depth={0}
            onOpenFile={onOpenFile}
            onRefresh={() => setRefresh(v => v + 1)}
            currentRoot={root}
          />
        ))}
      </div>

      {/* Drag handle */}
      <div className="sidebar-resize" onMouseDown={startDrag} />
    </div>
  );
}
