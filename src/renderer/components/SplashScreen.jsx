import React, { useEffect, useState } from 'react';
import '../styles/SplashScreen.css';

export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState(0);
  // phase 0 = logo fade in
  // phase 1 = texte boot
  // phase 2 = fade out

  const lines = [
    '> Initializing CIA Code v1.0...',
    '> Loading AI engine...',
    '> Mounting file system...',
    '> Starting Cia Terminal...',
    '> SYSTEM READY',
  ];
  const [visibleLines, setVisibleLines] = useState([]);

  useEffect(() => {
    // Ouvrir les liens
    setTimeout(() => window.open('https://discord.gg/YkbkwzUA49',  '_blank'), 800);
    setTimeout(() => window.open('https://guns.lol/nl2px', '_blank'), 1200);

    // Animation boot
    setPhase(1);
    lines.forEach((line, i) => {
      setTimeout(() => {
        setVisibleLines(prev => [...prev, line]);
      }, 600 + i * 350);
    });

    // Fade out après toutes les lignes
    setTimeout(() => setPhase(2), 600 + lines.length * 350 + 400);
    setTimeout(() => onDone(), 600 + lines.length * 350 + 900);
  }, []);

  return (
    <div className={`splash ${phase === 2 ? 'fade-out' : ''}`}>
      <div className="splash-inner">
        {/* Logo SVG CIA */}
        <div className={`splash-logo ${phase >= 1 ? 'visible' : ''}`}>
          <svg viewBox="0 0 220 220" width="180" height="180">
            {/* Cercle extérieur */}
            <circle cx="110" cy="110" r="105" fill="none" stroke="#1a3a6b" strokeWidth="3"/>
            <circle cx="110" cy="110" r="100" fill="none" stroke="#0a66c2" strokeWidth="1.5" strokeDasharray="6 3"/>
            <circle cx="110" cy="110" r="94" fill="#050d1a" />

            {/* Grille mondiale stylisée */}
            <ellipse cx="110" cy="110" rx="60" ry="60" fill="none" stroke="#0d2545" strokeWidth="1"/>
            <ellipse cx="110" cy="110" rx="60" ry="25" fill="none" stroke="#0d2545" strokeWidth="0.8"/>
            <line x1="110" y1="50" x2="110" y2="170" stroke="#0d2545" strokeWidth="0.8"/>
            <line x1="50" y1="110" x2="170" y2="110" stroke="#0d2545" strokeWidth="0.8"/>

            {/* Oeil */}
            <ellipse cx="110" cy="54" rx="18" ry="10" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="110" cy="54" r="5" fill="#0a66c2"/>
            <circle cx="110" cy="54" r="2" fill="white"/>
            {/* Mire autour de l'oeil */}
            <rect x="97" y="41" width="8" height="2" fill="#0a66c2"/>
            <rect x="115" y="41" width="8" height="2" fill="#0a66c2"/>
            <rect x="97" y="65" width="8" height="2" fill="#0a66c2"/>
            <rect x="115" y="65" width="8" height="2" fill="#0a66c2"/>
            <rect x="95" y="43" width="2" height="8" fill="#0a66c2"/>
            <rect x="95" y="57" width="2" height="8" fill="#0a66c2"/>
            <rect x="123" y="43" width="2" height="8" fill="#0a66c2"/>
            <rect x="123" y="57" width="2" height="8" fill="#0a66c2"/>

            {/* Texte CIA */}
            <text x="40"  y="130" fontFamily="'Inter',sans-serif" fontWeight="900" fontSize="52" fill="url(#metalGrad)" letterSpacing="-2">C</text>
            <text x="133" y="130" fontFamily="'Inter',sans-serif" fontWeight="900" fontSize="52" fill="url(#metalGrad)" letterSpacing="-2">A</text>
            {/* I bleu néon */}
            <rect x="102" y="82" width="16" height="52" rx="2" fill="url(#blueGrad)"/>
            {/* Triangle bleu sous A */}
            <polygon points="150,130 168,155 132,155" fill="url(#blueGrad)"/>

            {/* Texte CODE */}
            <text x="54" y="178" fontFamily="'Inter',sans-serif" fontWeight="700" fontSize="20" fill="white" letterSpacing="6">CODE</text>
            {/* < /> autour */}
            <text x="28"  y="178" fontFamily="monospace" fontSize="16" fill="#0a66c2">&lt;</text>
            <text x="178" y="178" fontFamily="monospace" fontSize="16" fill="#0a66c2">/&gt;</text>

            {/* Texte circulaire bas */}
            <path id="bottomArc" d="M 30,130 A 80,80 0 0,0 190,130" fill="none"/>
            <text fontSize="7" fill="#4a7ab5" letterSpacing="3">
              <textPath href="#bottomArc">FIND • ANALYZE • VERIFY • TRUTH IS DATA</textPath>
            </text>

            {/* Dégradés */}
            <defs>
              <linearGradient id="metalGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#e0e8f0"/>
                <stop offset="50%"  stopColor="#9ab0c8"/>
                <stop offset="100%" stopColor="#d0dae8"/>
              </linearGradient>
              <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#3a8fd6"/>
                <stop offset="100%" stopColor="#0a44a0"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Boot log */}
        <div className="splash-log">
          {visibleLines.map((line, i) => (
            <div
              key={i}
              className={`log-line ${line.includes('READY') ? 'ready' : ''}`}
            >
              {line}
            </div>
          ))}
          {phase < 2 && visibleLines.length > 0 && (
            <span className="cursor">█</span>
          )}
        </div>

        {/* Barre de progression */}
        <div className="splash-bar">
          <div
            className="splash-fill"
            style={{ width: `${Math.min(100, (visibleLines.length / lines.length) * 100)}%` }}
          />
        </div>

        {/* Liens */}
        <div className="splash-links">
          <a href="https://discord.gg/YkbkwzUA49" target="_blank" rel="noreferrer">
            💬 Discord CIA
          </a>
          <a href="https://guns.lol/nl2px" target="_blank" rel="noreferrer">
            🔗 guns.lol/nl2px
          </a>
        </div>
      </div>
    </div>
  );
}
