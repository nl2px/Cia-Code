import React from 'react';
import '../styles/TitleBar.css';

export default function TitleBar({
  onMinimize, onMaximize, onClose,
  onNewFile, onOpenFolder, onSave,
  onToggleAI, onToggleTerminal,
  showAI, showTerminal,
  manualEditorSlot,
}) {
  return (
    <div className="titlebar">
      {/* Logo */}
      <div className="titlebar-logo">
        <span className="logo-icon">⬡</span>
        <span className="logo-text">Cia Code</span>
      </div>

      {/* Menu actions */}
      <div className="titlebar-menu">
        <button className="tb-btn" onClick={onNewFile} title="Nouveau fichier">
          <span>＋</span> Nouveau
        </button>
        <button className="tb-btn" onClick={onOpenFolder} title="Ouvrir dossier">
          <span>📂</span> Ouvrir
        </button>
        <button className="tb-btn" onClick={onSave} title="Sauvegarder (Ctrl+S)">
          <span>💾</span> Sauver
        </button>
        {manualEditorSlot}
        <div className="tb-sep" />
        <button className={`tb-btn ${showAI ? 'active' : ''}`} onClick={onToggleAI} title="Panel IA">
          <span>🤖</span> IA
        </button>
        <button className={`tb-btn ${showTerminal ? 'active' : ''}`} onClick={onToggleTerminal} title="Cia Terminal">
          <span>▶</span> Terminal
        </button>
      </div>

      {/* Drag region */}
      <div className="titlebar-drag" />

      {/* Window controls */}
      <div className="titlebar-controls">
        <button className="wc-btn wc-min" onClick={onMinimize}>─</button>
        <button className="wc-btn wc-max" onClick={onMaximize}>□</button>
        <button className="wc-btn wc-close" onClick={onClose}>✕</button>
      </div>
    </div>
  );
}
