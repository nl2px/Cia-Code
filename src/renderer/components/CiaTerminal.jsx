import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import '../styles/CiaTerminal.css';

let termCounter = 0;

function TerminalInstance({ id, cwd, active }) {
  const divRef   = useRef(null);
  const termRef  = useRef(null);
  const fitRef   = useRef(null);
  const unsubRef = useRef(null);
  const readyRef = useRef(false);

  useEffect(() => {
    const term = new Terminal({
      theme: {
        background:   '#0a0e14',
        foreground:   '#b3c4e8',
        cursor:       '#7ec8e3',
        cursorAccent: '#0a0e14',
        selectionBackground: 'rgba(88,166,255,0.25)',
        black:        '#0a0e14',
        red:          '#ff6b6b',
        green:        '#a8ff78',
        yellow:       '#ffe66d',
        blue:         '#4facfe',
        magenta:      '#c371e3',
        cyan:         '#7ec8e3',
        white:        '#b3c4e8',
        brightBlack:  '#3d4459',
        brightRed:    '#ff8585',
        brightGreen:  '#b8ff92',
        brightYellow: '#fff080',
        brightBlue:   '#79c5ff',
        brightMagenta:'#d98aff',
        brightCyan:   '#9ee3f3',
        brightWhite:  '#e6f0ff',
      },
      fontFamily: '"JetBrains Mono", "Cascadia Code", "Consolas", monospace',
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: 'block',
      allowTransparency: true,
      scrollback: 10000,
      convertEol: true,
    });

    const fitAddon   = new FitAddon();
    const linksAddon = new WebLinksAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(linksAddon);
    term.open(divRef.current);

    termRef.current = term;
    fitRef.current  = fitAddon;

    // Fit initial après que le DOM soit prêt
    requestAnimationFrame(() => {
      fitAddon.fit();
    });

    // Démarrer le processus PTY côté main
    window.cia.terminalCreate(id, cwd).then((result) => {
      if (!result.success) {
        term.writeln('\x1b[31m[Erreur] Impossible de démarrer le terminal: ' + (result.error || 'inconnu') + '\x1b[0m');
        term.writeln('\x1b[33m[Info] Vérifiez que node-pty est installé: npm install node-pty\x1b[0m');
        return;
      }

      readyRef.current = true;

      // Recevoir les données du PTY
      unsubRef.current = window.cia.onTerminalData(id, (data) => {
        term.write(data);
      });

      // Signal de fin
      window.cia.onTerminalExit(id, () => {
        term.writeln('\r\n\x1b[33m[Processus terminé — appuyez sur Entrée pour relancer]\x1b[0m');
        readyRef.current = false;
      });

      // Envoyer les frappes clavier au PTY
      term.onData((data) => {
        window.cia.terminalInput(id, data);
      });

      // Envoyer les redimensionnements
      term.onResize(({ cols, rows }) => {
        window.cia.terminalResize(id, cols, rows);
      });

      // Écouter les commandes envoyées par l'IA
      const runHandler = (e) => {
        if (!active) return;
        const cmd = e.detail;
        window.cia.terminalInput(id, cmd + '\n');
      };
      window.addEventListener('cia-run-command', runHandler);
      // Stocker pour cleanup
      term._ciaRunHandler = runHandler;
    });

    // Observer les redimensionnements du conteneur
    const ro = new ResizeObserver(() => {
      fitAddon.fit();
    });
    if (divRef.current) ro.observe(divRef.current);

    return () => {
      ro.disconnect();
      if (unsubRef.current) unsubRef.current();
      if (termRef.current?._ciaRunHandler) {
        window.removeEventListener('cia-run-command', termRef.current._ciaRunHandler);
      }
      window.cia.terminalKill(id);
      term.dispose();
    };
  }, [id, cwd]);

  // Quand l'onglet devient actif, refaire le fit
  useEffect(() => {
    if (active && fitRef.current) {
      requestAnimationFrame(() => fitRef.current?.fit());
    }
  }, [active]);

  return (
    <div
      ref={divRef}
      className="xterm-container"
      style={{
        display: active ? 'flex' : 'none',
        height: '100%',
        width: '100%',
      }}
    />
  );
}

export default function CiaTerminal({ height, onResize, cwd, onClose }) {
  const [tabs, setTabs]         = useState(() => {
    const id = `term-${++termCounter}`;
    return [{ id, label: 'Cia Terminal 1' }];
  });
  const [activeId, setActiveId] = useState(() => tabs[0].id);
  const dragRef = useRef(null);

  const addTab = useCallback(() => {
    const id    = `term-${++termCounter}`;
    const label = `Cia Terminal ${termCounter}`;
    setTabs(prev => [...prev, { id, label }]);
    setActiveId(id);
  }, []);

  const removeTab = useCallback((id) => {
    setTabs(prev => {
      const idx  = prev.findIndex(t => t.id === id);
      const next = prev.filter(t => t.id !== id);
      if (activeId === id && next.length > 0) {
        setActiveId(next[Math.max(0, idx - 1)].id);
      }
      return next;
    });
    window.cia.terminalKill(id);
  }, [activeId]);

  // Ouvrir dans une fenêtre externe (nouvelle fenêtre système)
  const openExternal = useCallback(() => {
    window.cia.openExternalTerminal(cwd);
  }, [cwd]);

  // Resize vertical
  const startDrag = (e) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = height;
    const onMove = (ev) => {
      onResize(Math.max(120, Math.min(700, startH - (ev.clientY - startY))));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div className="cia-terminal" style={{ height }}>
      {/* Poignée de resize */}
      <div className="terminal-resize-handle" onMouseDown={startDrag} />

      {/* Barre d'onglets */}
      <div className="terminal-header">
        <div className="terminal-tabs">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`term-tab ${tab.id === activeId ? 'active' : ''}`}
              onClick={() => setActiveId(tab.id)}
            >
              <span className="term-tab-icon">▶</span>
              <span>{tab.label}</span>
              {tabs.length > 1 && (
                <button
                  className="term-tab-close"
                  onClick={e => { e.stopPropagation(); removeTab(tab.id); }}
                  title="Fermer"
                >✕</button>
              )}
            </div>
          ))}
          <button className="term-new" onClick={addTab} title="Nouveau terminal">＋</button>
        </div>

        <div className="term-actions">
          <button
            className="term-action-btn"
            onClick={openExternal}
            title="Ouvrir Cia Terminal dans une fenêtre séparée"
          >
            ⧉ Détacher
          </button>
          <button className="term-close-all" onClick={onClose} title="Fermer le terminal">✕</button>
        </div>
      </div>

      {/* Corps du terminal */}
      <div className="terminal-body">
        {tabs.map(tab => (
          <TerminalInstance
            key={tab.id}
            id={tab.id}
            cwd={cwd}
            active={tab.id === activeId}
          />
        ))}
      </div>
    </div>
  );
}
