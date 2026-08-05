import React, { useState, useRef, useEffect, useCallback } from 'react';
import '../styles/AIPanel.css';

const SYSTEM_PROMPT = `Tu es CIA — une IA de développement intégrée dans Cia Code.
Tu peux coder en Python, JavaScript, TypeScript, HTML, CSS, C, C++, Rust, Go, Java, PHP, Ruby, SQL, Bash et tout autre langage.
RÈGLES IMPORTANTES :
1. Tu génères du code COMPLET et FONCTIONNEL. Jamais de placeholder ni de "..." ni de code partiel.
2. Avant CHAQUE bloc de code, écris le nom du fichier sur une ligne séparée comme ceci : ===FICHIER: nom.ext===
3. Les fichiers seront créés AUTOMATIQUEMENT sans que l'utilisateur clique quoi que ce soit.
4. Si plusieurs fichiers sont nécessaires, génère-les tous avec leur marqueur ===FICHIER: ===.
5. Réponds en français sauf si l'utilisateur parle une autre langue.
Exemple de ta réponse :
Voici l'application :
===FICHIER: app.py===
\`\`\`python
# code complet ici
\`\`\``;

const PROVIDERS = [
  { id:'groq',        name:'Groq',           icon:'⚡', badge:'GRATUIT',   badgeColor:'#3fb950', description:'Ultra rapide — Llama 3.3 70B', apiKeyLink:'https://console.groq.com/keys',           apiKeyPlaceholder:'gsk_...',      baseURL:'https://api.groq.com/openai/v1',                        models:[{id:'llama-3.3-70b-versatile',label:'Llama 3.3 70B ✦'},{id:'llama-3.1-8b-instant',label:'Llama 3.1 8B (rapide)'},{id:'mixtral-8x7b-32768',label:'Mixtral 8x7B'},{id:'gemma2-9b-it',label:'Gemma 2 9B'}], defaultModel:'llama-3.3-70b-versatile' },
  { id:'grok',        name:'Grok (xAI)',      icon:'🤖', badge:'GRATUIT*',  badgeColor:'#f0883e', description:'IA de X — Grok 2',             apiKeyLink:'https://console.x.ai/',                   apiKeyPlaceholder:'xai-...',      baseURL:'https://api.x.ai/v1',                                   models:[{id:'grok-2-latest',label:'Grok 2'},{id:'grok-beta',label:'Grok Beta'}], defaultModel:'grok-2-latest', note:'25$/mois de crédits offerts' },
  { id:'gemini',      name:'Google Gemini',   icon:'✦',  badge:'GRATUIT',   badgeColor:'#3fb950', description:'Gemini 1.5 Flash/Pro',          apiKeyLink:'https://aistudio.google.com/app/apikey', apiKeyPlaceholder:'AIza...',      baseURL:'https://generativelanguage.googleapis.com/v1beta/openai',models:[{id:'gemini-1.5-flash',label:'Gemini 1.5 Flash (gratuit)'},{id:'gemini-1.5-pro',label:'Gemini 1.5 Pro'},{id:'gemini-2.0-flash-exp',label:'Gemini 2.0 Flash'}], defaultModel:'gemini-1.5-flash' },
  { id:'mistral',     name:'Mistral AI',      icon:'🌀', badge:'GRATUIT',   badgeColor:'#3fb950', description:'Mistral 7B, Codestral',         apiKeyLink:'https://console.mistral.ai/api-keys/',   apiKeyPlaceholder:'votre-clé...', baseURL:'https://api.mistral.ai/v1',                             models:[{id:'mistral-small-latest',label:'Mistral Small'},{id:'open-mistral-7b',label:'Mistral 7B'},{id:'codestral-latest',label:'Codestral (code)'}], defaultModel:'mistral-small-latest' },
  { id:'openrouter',  name:'OpenRouter',      icon:'🔀', badge:'GRATUIT*',  badgeColor:'#f0883e', description:'200+ modèles dont gratuits',    apiKeyLink:'https://openrouter.ai/keys',              apiKeyPlaceholder:'sk-or-...',    baseURL:'https://openrouter.ai/api/v1',                          models:[{id:'meta-llama/llama-3.1-8b-instruct:free',label:'🆓 Llama 3.1 8B'},{id:'deepseek/deepseek-chat:free',label:'🆓 DeepSeek V3'},{id:'qwen/qwen-2.5-72b-instruct:free',label:'🆓 Qwen 2.5 72B'},{id:'google/gemma-2-9b-it:free',label:'🆓 Gemma 2 9B'}], defaultModel:'meta-llama/llama-3.1-8b-instruct:free', note:'Modèles :free 100% gratuits' },
  { id:'huggingface', name:'Hugging Face',    icon:'🤗', badge:'GRATUIT',   badgeColor:'#3fb950', description:'Inference API gratuite',        apiKeyLink:'https://huggingface.co/settings/tokens', apiKeyPlaceholder:'hf_...',       baseURL:'https://api-inference.huggingface.co/v1',               models:[{id:'Qwen/Qwen2.5-72B-Instruct',label:'Qwen 2.5 72B'},{id:'meta-llama/Llama-3.1-8B-Instruct',label:'Llama 3.1 8B'}], defaultModel:'Qwen/Qwen2.5-72B-Instruct' },
  { id:'ollama',      name:'Ollama (Local)',  icon:'🦙', badge:'100% LOCAL', badgeColor:'#58a6ff', description:'IA locale — 0 clé API',        apiKeyLink:'https://ollama.ai/download',             apiKeyPlaceholder:'(pas de clé)', baseURL:'http://localhost:11434/v1',                              models:[{id:'llama3.2',label:'Llama 3.2'},{id:'codellama',label:'Code Llama'},{id:'deepseek-coder',label:'DeepSeek Coder'},{id:'mistral',label:'Mistral'},{id:'qwen2.5-coder',label:'Qwen 2.5 Coder'}], defaultModel:'llama3.2', noKey:true },
  { id:'openai',      name:'OpenAI',          icon:'◎',  badge:'PAYANT',    badgeColor:'#8b949e', description:'GPT-4o, GPT-4 Turbo',          apiKeyLink:'https://platform.openai.com/api-keys',   apiKeyPlaceholder:'sk-...',       baseURL:'https://api.openai.com/v1',                             models:[{id:'gpt-4o',label:'GPT-4o'},{id:'gpt-4o-mini',label:'GPT-4o Mini'},{id:'gpt-4-turbo',label:'GPT-4 Turbo'}], defaultModel:'gpt-4o' },
];

// Extension → langage Monaco
const EXT_LANG = { py:'python',js:'javascript',ts:'typescript',jsx:'javascript',tsx:'typescript',html:'html',css:'css',c:'c',cpp:'cpp',h:'c',json:'json',md:'markdown',sh:'shell',rs:'rust',go:'go',java:'java',rb:'ruby',php:'php',sql:'sql',txt:'plaintext' };
function extToLang(name) { return EXT_LANG[(name||'').split('.').pop().toLowerCase()] || 'plaintext'; }

// Trouver le nom de fichier suggéré dans le texte avant le bloc ```
function extractFileName(textBefore, lang) {
  const m = textBefore.match(/===FICHIER:\s*([^\s=\n]+)===\s*$/i);
  if (m) return m[1].trim();
  const defaults = { python:'script.py',javascript:'script.js',typescript:'script.ts',html:'index.html',css:'style.css',c:'main.c',cpp:'main.cpp',rust:'main.rs',go:'main.go',java:'Main.java',shell:'script.sh',sql:'query.sql',markdown:'README.md' };
  return defaults[lang] || `code.${lang||'txt'}`;
}

// Parser la réponse en parties text + code
function parseContent(content) {
  const parts = [];
  const regex = /```(\w*)\n?([\s\S]*?)```/g;
  let last = 0, m;
  while ((m = regex.exec(content)) !== null) {
    if (m.index > last) parts.push({ type:'text', content: content.slice(last, m.index) });
    const textBefore = content.slice(0, m.index);
    parts.push({ type:'code', lang: m[1]||'', code: m[2].trim(), filename: extractFileName(textBefore, m[1]) });
    last = m.index + m[0].length;
  }
  if (last < content.length) parts.push({ type:'text', content: content.slice(last) });
  return parts;
}

// ─── CodeBlock ────────────────────────────────────────────────────────────────
function CodeBlock({ lang, code, filename, created }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(()=>setCopied(false),1500); };
  return (
    <div className="code-block">
      <div className="code-header">
        <div className="code-header-left">
          <span className="code-lang">{lang||'code'}</span>
          {filename && <span className="code-filename-tag">{filename}</span>}
        </div>
        <button className="code-btn" onClick={copy}>{copied?'✓ Copié':'📋 Copier'}</button>
      </div>
      <pre className="code-pre"><code>{code}</code></pre>
      {created && (
        <div className="code-auto-created">
          ✓ Créé automatiquement : <strong>{filename}</strong>
        </div>
      )}
    </div>
  );
}

// ─── MessageBubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  // Extraire le texte — le content peut être string ou tableau (multimodal)
  const textContent = typeof msg.content === 'string'
    ? msg.content
    : (msg.content?.find(p => p.type === 'text')?.text || '');

  const parts = parseContent(textContent);

  return (
    <div className={`msg-bubble ${msg.role}`}>
      <div className="msg-avatar">{msg.role==='assistant'?'⬡':'👤'}</div>
      <div className="msg-body">
        {/* Images jointes par l'utilisateur */}
        {msg._images?.length > 0 && (
          <div className="msg-images-row">
            {msg._images.map((src, i) => (
              <img key={i} src={src} className="msg-img-thumb" alt="image jointe"/>
            ))}
          </div>
        )}
        {parts.map((p, i) =>
          p.type==='code'
            ? <CodeBlock key={i} lang={p.lang} code={p.code} filename={p.filename} created={msg.filesCreated?.includes(p.filename)} />
            : <p key={i} className="msg-text">{p.content}</p>
        )}
      </div>
    </div>
  );
}

// ─── Provider selector ────────────────────────────────────────────────────────
function ProviderSelector({ current, onSelect }) {
  return (
    <div className="provider-grid">
      {PROVIDERS.map(p => (
        <button key={p.id} className={`provider-card ${current===p.id?'active':''}`} onClick={()=>onSelect(p.id)}>
          <span className="provider-icon">{p.icon}</span>
          <span className="provider-name">{p.name}</span>
          <span className="provider-badge" style={{background:p.badgeColor+'22',color:p.badgeColor,borderColor:p.badgeColor+'44'}}>{p.badge}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────
function SettingsPanel({ onClose }) {
  const init = PROVIDERS.find(p=>p.id===(localStorage.getItem('cia-provider')||'groq'))||PROVIDERS[0];
  const [sel,    setSel]    = useState(init.id);
  const [apiKey, setApiKey] = useState(()=>localStorage.getItem(`cia-key-${init.id}`)||'');
  const [model,  setModel]  = useState(()=>localStorage.getItem(`cia-model-${init.id}`)||init.defaultModel);
  const [tab,    setTab]    = useState('provider');
  const cur = PROVIDERS.find(p=>p.id===sel)||PROVIDERS[0];

  const pick = (id) => {
    setSel(id);
    const p = PROVIDERS.find(x=>x.id===id);
    setApiKey(localStorage.getItem(`cia-key-${id}`)||'');
    setModel(localStorage.getItem(`cia-model-${id}`)||p.defaultModel);
    setTab('config');
  };
  const save = () => {
    localStorage.setItem('cia-provider', sel);
    localStorage.setItem(`cia-key-${sel}`, apiKey);
    localStorage.setItem(`cia-model-${sel}`, model);
    onClose();
  };

  return (
    <div className="settings-overlay">
      <div className="settings-modal">
        <div className="settings-modal-header"><span>⚙️ Configuration IA</span><button onClick={onClose}>✕</button></div>
        <div className="settings-tabs">
          <button className={tab==='provider'?'active':''} onClick={()=>setTab('provider')}>Provider</button>
          <button className={tab==='config'?'active':''} onClick={()=>setTab('config')}>Clé & Modèle</button>
        </div>
        {tab==='provider' && (
          <div className="settings-tab-content">
            <p className="settings-hint">Sélectionne le provider IA :</p>
            <ProviderSelector current={sel} onSelect={pick}/>
          </div>
        )}
        {tab==='config' && (
          <div className="settings-tab-content">
            <div className="current-provider-info">
              <span className="cp-icon">{cur.icon}</span>
              <div><div className="cp-name">{cur.name}</div><div className="cp-desc">{cur.description}</div></div>
              <span className="provider-badge" style={{background:cur.badgeColor+'22',color:cur.badgeColor,borderColor:cur.badgeColor+'44'}}>{cur.badge}</span>
            </div>
            {cur.note && <div className="settings-note-box">💡 {cur.note}</div>}
            {!cur.noKey && (<><label>Clé API <a href={cur.apiKeyLink} target="_blank" rel="noreferrer" className="get-key-link">Obtenir gratuite →</a></label><input type="password" placeholder={cur.apiKeyPlaceholder} value={apiKey} onChange={e=>setApiKey(e.target.value)}/></>)}
            {cur.noKey && <div className="settings-note-box">🦙 <a href={cur.apiKeyLink} target="_blank" rel="noreferrer">Télécharger Ollama →</a><br/>Puis : <code>ollama pull {cur.defaultModel}</code></div>}
            <label>Modèle</label>
            <select value={model} onChange={e=>setModel(e.target.value)}>{cur.models.map(m=><option key={m.id} value={m.id}>{m.label}</option>)}</select>
            <button className="settings-save" onClick={save}>✓ Utiliser {cur.name}</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AIPanel({ width, onResize, messages, onMessages, activeFile, explorerRoot, onCreateFile, onInsertCode, onRunCommand }) {
  const [input,        setInput]        = useState('');
  const [images,       setImages]       = useState([]); // [{name, dataUrl, base64, mimeType}]
  const [loadingMsg,   setLoadingMsg]   = useState('');
  const [loadingPct,   setLoadingPct]   = useState(0);
  const [loading,      setLoading]      = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [dragOver,     setDragOver]     = useState(false);
  const bottomRef      = useRef(null);
  const textareaRef    = useRef(null);
  const dragRef        = useRef(null);
  const pctIntervalRef = useRef(null);
  const fileInputRef   = useRef(null);

  const getProvider = () => { const id=localStorage.getItem('cia-provider')||'groq'; return PROVIDERS.find(p=>p.id===id)||PROVIDERS[0]; };
  const [activeProv, setActiveProv] = useState(getProvider);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages, loading]);

  // Avancer lentement la barre pendant que l'IA réfléchit (jamais dépasse 85% seul)
  const startProgressSlow = () => {
    setLoadingPct(0);
    clearInterval(pctIntervalRef.current);
    pctIntervalRef.current = setInterval(() => {
      setLoadingPct(prev => {
        if (prev >= 85) return prev; // plafond — le reste est rempli par les étapes réelles
        return prev + 0.4;           // avance lentement (~45s pour 85%)
      });
    }, 200);
  };

  const stopProgress = () => {
    clearInterval(pctIntervalRef.current);
  };

  useEffect(() => () => clearInterval(pctIntervalRef.current), []);

  // ── Convertir un File en objet image base64 ─────────────────────────────────
  const readImageFile = (file) => new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/')) return resolve(null);
    const reader = new FileReader();
    reader.onload = (e) => resolve({
      name: file.name,
      dataUrl: e.target.result,
      base64: e.target.result.split(',')[1],
      mimeType: file.type,
    });
    reader.readAsDataURL(file);
  });

  // ── Coller image depuis presse-papier Ctrl+V ─────────────────────────────────
  const handlePaste = useCallback(async (e) => {
    const items = Array.from(e.clipboardData?.items || []);
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const img = await readImageFile(item.getAsFile());
        if (img) setImages(prev => [...prev, img]);
      }
    }
  }, []);

  // ── Drag & drop ───────────────────────────────────────────────────────────────
  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    const imgs  = (await Promise.all(files.map(readImageFile))).filter(Boolean);
    setImages(prev => [...prev, ...imgs]);
  }, []);

  // ── Sélection via bouton 🖼️ ─────────────────────────────────────────────────
  const handleFileInput = useCallback(async (e) => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'));
    const imgs  = (await Promise.all(files.map(readImageFile))).filter(Boolean);
    setImages(prev => [...prev, ...imgs]);
    e.target.value = '';
  }, []);

  const removeImage = (idx) => setImages(prev => prev.filter((_, i) => i !== idx));

  // ── Envoi du message + images + création auto des fichiers ──────────────────
  const send = useCallback(async () => {
    const text = input.trim();
    if ((!text && images.length === 0) || loading) return;

    // Construire le contenu — texte seul OU multimodal (texte + images)
    let userContent;
    if (images.length > 0) {
      userContent = [
        { type: 'text', text: text || 'Analyse cette image et aide-moi.' },
        ...images.map(img => ({
          type: 'image_url',
          image_url: { url: `data:${img.mimeType};base64,${img.base64}`, detail: 'high' }
        }))
      ];
    } else {
      userContent = text;
    }

    const userMsg = { role:'user', content: userContent, _images: images.map(i => i.dataUrl) };
    const history = [...messages, userMsg];
    onMessages(history);
    setInput('');
    setImages([]);
    setLoading(true);
    startProgressSlow();

    const prov   = getProvider();
    setLoadingMsg(`${prov.icon} ${prov.name} réfléchit...`);

    const apiKey = localStorage.getItem(`cia-key-${prov.id}`) || '';
    const model  = localStorage.getItem(`cia-model-${prov.id}`) || prov.defaultModel;

    let sys = SYSTEM_PROMPT;
    if (activeFile) sys += `\n\nFichier actif: ${activeFile.name}\n\`\`\`${extToLang(activeFile.name)}\n${activeFile.content.slice(0,3000)}\n\`\`\``;
    if (explorerRoot) sys += `\n\nDossier de travail: ${explorerRoot}`;

    // Providers qui supportent les images (vision)
    const VISION_PROVIDERS = ['openai', 'grok', 'gemini', 'openrouter'];
    const supportsVision = VISION_PROVIDERS.includes(prov.id);

    // Nettoyer avant envoi API — garder seulement role+content
    // Pour les providers sans vision : convertir le tableau en texte simple
    const cleanHistory = history.slice(-20).map(({ role, content }) => {
      if (Array.isArray(content)) {
        if (supportsVision) {
          return { role, content };
        } else {
          // Extraire uniquement le texte, ignorer les images
          const text = content.find(p => p.type === 'text')?.text || '';
          return { role, content: text + (content.some(p => p.type === 'image_url') ? '\n[Image jointe — ce modèle ne supporte pas les images. Utilise Gemini ou GPT-4o pour analyser des images.]' : '') };
        }
      }
      return { role, content };
    });
    const payload = [{ role:'system', content:sys }, ...cleanHistory];

    try {
      if (!apiKey && !prov.noKey) {
        await new Promise(r=>setTimeout(r,200));
        onMessages([...history, { role:'assistant', content:`🔑 **Clé API manquante pour ${prov.name}**\n\nClique sur ⚙️ pour configurer.\n\n**Gratuits recommandés :**\n- ⚡ Groq → [console.groq.com/keys](https://console.groq.com/keys)\n- ✦ Gemini → [aistudio.google.com](https://aistudio.google.com/app/apikey)\n- 🔀 OpenRouter → [openrouter.ai/keys](https://openrouter.ai/keys)` }]);
        return;
      }

      const result = await window.cia.aiChat(payload, apiKey, model, prov.baseURL);

      if (result.error) {
        const e = typeof result.error==='string' ? result.error : (result.error?.message||JSON.stringify(result.error));
        let help='';
        if (e.includes('401')||e.includes('Unauthorized')||e.includes('invalid_api_key')) help='\n\n🔑 Clé API invalide — vérifie dans ⚙️';
        else if (e.includes('429')||e.includes('rate_limit')) help='\n\n⏳ Limite atteinte — réessaie dans quelques secondes.';
        else if (e.includes('ECONNREFUSED')||e.includes('Connexion refusée')) help='\n\n🔌 Serveur inaccessible. Pour Ollama, lance `ollama serve`.';
        throw new Error(e+help);
      }

      const content = result.choices?.[0]?.message?.content;
      if (!content) throw new Error('Réponse vide.');

      // ── Créer AUTOMATIQUEMENT TOUS les fichiers, sans limite ──────────────
      const parts      = parseContent(content);
      const codeBlocks = parts.filter(p => p.type === 'code' && p.filename);
      const filesCreated = [];

      // Réponse reçue → barre à 85%, on stoppe l'avance lente
      stopProgress();
      setLoadingPct(85);

      for (let i = 0; i < codeBlocks.length; i++) {
        const part = codeBlocks[i];
        try {
          setLoadingMsg(`💾 Création de ${part.filename}... (${i+1}/${codeBlocks.length})`);
          setLoadingPct(85 + ((i + 0.5) / Math.max(codeBlocks.length, 1)) * 14);
          await onCreateFile(part.filename, part.code);
          filesCreated.push(part.filename);
          setLoadingPct(85 + ((i + 1) / Math.max(codeBlocks.length, 1)) * 14);
          await new Promise(r => setTimeout(r, 350));
        } catch (err) {
          console.warn('Impossible de créer', part.filename, err);
        }
      }

      setLoadingPct(100);
      if (filesCreated.length > 0) {
        setLoadingMsg(`✓ ${filesCreated.length} fichier(s) créé(s) !`);
        await new Promise(r => setTimeout(r, 900));
      } else {
        await new Promise(r => setTimeout(r, 400));
      }

      // Ajouter le message seulement quand tout est créé
      onMessages([...history, { role:'assistant', content, filesCreated }]);

    } catch (err) {
      onMessages([...history, { role:'assistant', content:`❌ **Erreur ${prov.name}**\n\n${err.message}` }]);
    } finally {
      stopProgress();
      setLoading(false);
      setLoadingMsg('');
      setLoadingPct(0);
    }
  }, [input, images, loading, messages, activeFile, explorerRoot, onCreateFile, onMessages]);

  const handleKey = (e) => { if (e.key==='Enter'&&!e.shiftKey) { e.preventDefault(); send(); } };
  const startDrag = (e) => {
    dragRef.current = e.clientX;
    const onMove = ev => onResize(Math.max(260, Math.min(700, width-(ev.clientX-dragRef.current))));
    const onUp   = () => { window.removeEventListener('mousemove',onMove); window.removeEventListener('mouseup',onUp); };
    window.addEventListener('mousemove',onMove); window.addEventListener('mouseup',onUp);
  };
  const insertCtx = () => { if (activeFile) setInput(p=>p+`\nVoici mon fichier ${activeFile.name}:\n\`\`\`${extToLang(activeFile.name)}\n${activeFile.content}\n\`\`\`\n`); };

  return (
    <>
      {showSettings && <SettingsPanel onClose={()=>{ setShowSettings(false); setActiveProv(getProvider()); }}/>}
      <div className="ai-panel" style={{ width }}
        onDragOver={e=>{ e.preventDefault(); setDragOver(true); }}
        onDragLeave={e=>{ if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(false); }}
        onDrop={handleDrop}
      >
        {dragOver && (
          <div className="ai-drag-overlay">
            <div className="ai-drag-inner">🖼️<br/>Dépose l'image ici</div>
          </div>
        )}
        <div className="ai-resize" onMouseDown={startDrag}/>

        <div className="ai-header">
          <div className="ai-title">
            <span className="ai-icon">{activeProv.icon}</span>
            <div><div className="ai-title-name">CIA Intelligence</div><div className="ai-title-sub">{activeProv.name}</div></div>
          </div>
          <div className="ai-header-actions">
            <button className="ai-btn" onClick={()=>onMessages([])} title="Effacer">🗑️</button>
            <button className="ai-btn" onClick={()=>setShowSettings(true)} title="Paramètres">⚙️</button>
          </div>
        </div>

        <div className="provider-pills">
          {PROVIDERS.filter(p=>['groq','grok','gemini','openrouter','ollama'].includes(p.id)).map(p=>(
            <button key={p.id} className={`provider-pill ${activeProv.id===p.id?'active':''}`}
              onClick={()=>{ localStorage.setItem('cia-provider',p.id); setActiveProv(p); }} title={p.description}>
              {p.icon} {p.name}
            </button>
          ))}
          <button className="provider-pill" onClick={()=>setShowSettings(true)}>···</button>
        </div>

        <div className="ai-messages">
          {messages.length===0 && (
            <div className="ai-welcome">
              <div className="ai-welcome-icon">{activeProv.icon}</div>
              <h3>CIA Intelligence</h3>
              <p><span className="provider-badge" style={{background:activeProv.badgeColor+'22',color:activeProv.badgeColor,borderColor:activeProv.badgeColor+'44'}}>{activeProv.badge}</span> {activeProv.name}</p>
              <div className="ai-welcome-hint">
                <div className="hint-item">⚡ L'IA crée les fichiers <strong>automatiquement</strong> dès sa réponse</div>
                <div className="hint-item">🖼️ Glisse une image, colle avec <strong>Ctrl+V</strong> ou clique 🖼️</div>
                <div className="hint-item">📂 Ouvre un dossier d'abord pour que les fichiers s'y créent</div>
              </div>
              <div className="ai-suggestions">
                {['Crée une API REST Flask complète','Fais un jeu Snake en JavaScript','Crée une page web moderne','Écris un programme C qui trie des nombres'].map(s=>(
                  <button key={s} className="suggestion" onClick={()=>setInput(s)}>{s}</button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg,i)=><MessageBubble key={i} msg={msg}/>)}
          {loading && (
            <div className="msg-bubble assistant">
              <div className="msg-avatar">{activeProv.icon}</div>
              <div className="msg-body">
                <div className="loading-status">
                  <div className="loading-dots"><span/><span/><span/></div>
                  {loadingMsg && <span className="loading-text">{loadingMsg}</span>}
                  <div className="loading-bar-track">
                    <div className="loading-bar-fill" style={{ width: `${loadingPct}%` }}/>
                    <span className="loading-bar-pct">{Math.round(loadingPct)}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>

        <div className="ai-input-area" onPaste={handlePaste}>
          {/* Aperçu des images attachées */}
          {images.length > 0 && (
            <div className="img-preview-bar">
              {!['openai','grok','gemini','openrouter'].includes(activeProv.id) && (
                <div className="img-vision-warn">
                  ⚠️ <strong>{activeProv.name}</strong> ne supporte pas les images. Passe sur <strong>Gemini</strong> ou <strong>GPT-4o</strong>.
                </div>
              )}
              {images.map((img, i) => (
                <div key={i} className="img-preview-item">
                  <img src={img.dataUrl} alt={img.name} className="img-preview-thumb"/>
                  <button className="img-remove-btn" onClick={()=>removeImage(i)} title="Retirer">✕</button>
                </div>
              ))}
            </div>
          )}
          {activeFile && <button className="ctx-file-btn" onClick={insertCtx}>📎 {activeFile.name}</button>}
          <div className="ai-input-row">
            <button className="ai-img-btn" onClick={()=>fileInputRef.current?.click()} title="Ajouter une image (ou glisse / Ctrl+V)">🖼️</button>
            <input ref={fileInputRef} type="file" accept="image/*" multiple style={{display:'none'}} onChange={handleFileInput}/>
            <textarea ref={textareaRef} className="ai-input"
              placeholder="Demande, colle une image (Ctrl+V), glisse... (Entrée pour envoyer)"
              value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKey} rows={3}/>
            <button className={`ai-send ${loading?'loading':''}`} onClick={send} disabled={loading}>
              {loading?'⏳':'▶'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
