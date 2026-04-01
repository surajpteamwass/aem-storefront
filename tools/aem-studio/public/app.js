/* ── State ──────────────────────────────────────────── */
const S = { org:'', repo:'', branch:'development', currentPath:null, currentContent:'', chatHistory:[], figmaImageUrl:null };

/* ── DOM ────────────────────────────────────────────── */
const $  = id => document.getElementById(id);
const fileTree      = $('fileTree');
const codeEditor    = $('codeEditor');
const chatMessages  = $('chatMessages');
const chatInput     = $('chatInput');
const sendBtn       = $('sendBtn');
const previewFrame  = $('previewFrame');
const previewEmpty  = $('previewEmpty');

/* ── Init ───────────────────────────────────────────── */
async function init() {
  const cfg = await api('/api/config');
  S.org = cfg.org; S.repo = cfg.repo;
  $('orgLabel').textContent = `${cfg.org} / ${cfg.repo}`;
  loadSettings();
  loadFiles();
}

/* ── Files ──────────────────────────────────────────── */
async function loadFiles(path = '') {
  fileTree.innerHTML = '<div class="state-msg">Loading...</div>';
  const data = await api(`/api/files?path=${encodeURIComponent(path)}`).catch(e => { fileTree.innerHTML = `<div class="state-msg">${e.message}</div>`; return null; });
  if (!data) return;
  renderFiles(data, path);
}

function renderFiles(data, base) {
  fileTree.innerHTML = '';
  if (base) {
    const back = fi('← ..', false, true);
    back.onclick = () => loadFiles(base.split('/').slice(0,-1).join('/'));
    fileTree.appendChild(back);
  }
  const items = data.children || [];
  if (!items.length) { fileTree.innerHTML += '<div class="state-msg">Empty</div>'; return; }
  items.forEach(item => {
    const name   = item.name || item.path?.split('/').pop() || String(item);
    const isDir  = !!item.folder || (!item.path?.includes('.') && !item.ext);
    const fullPath = base ? `${base}/${name}` : name;
    const el = fi(name, isDir);
    if (S.currentPath === fullPath) el.classList.add('active');
    el.onclick = () => {
      if (isDir) { loadFiles(fullPath); return; }
      document.querySelectorAll('.fi').forEach(x => x.classList.remove('active'));
      el.classList.add('active');
      openFile(fullPath, name);
    };
    fileTree.appendChild(el);
  });
}

function fi(name, isDir, isBack = false) {
  const el = document.createElement('div');
  el.className = 'fi';
  const icon = isBack
    ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#777" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>`
    : isDir
    ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="#e8b84b" stroke="none"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`
    : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4e9eff" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
  el.innerHTML = `${icon} ${name}`;
  return el;
}

async function openFile(path, name) {
  $('currentFileName').textContent = name;
  S.currentPath = path;
  codeEditor.value = 'Loading...';
  const data = await api(`/api/content?path=${encodeURIComponent(path)}`).catch(e => { toast(e.message,'error'); return null; });
  if (!data) return;
  S.currentContent = data.content || '';
  codeEditor.value = S.currentContent;
  updateUrlBar();
  toast(`Opened: ${name}`, 'info');
}

codeEditor.addEventListener('input', () => S.currentContent = codeEditor.value);
codeEditor.addEventListener('keydown', e => {
  if (e.key === 'Tab') { e.preventDefault(); const s = codeEditor.selectionStart; codeEditor.value = codeEditor.value.slice(0,s)+'  '+codeEditor.value.slice(codeEditor.selectionEnd); codeEditor.selectionStart = codeEditor.selectionEnd = s+2; }
});

/* ── Actions ────────────────────────────────────────── */
$('uploadBtn').onclick = async () => {
  if (!S.currentPath) return toast('Select a file first','error');
  withLoading('uploadBtn', async () => {
    const r = await api('/api/upload',{ method:'POST', json:{ path:S.currentPath, content:codeEditor.value } });
    if (r.error) throw new Error(r.error);
    toast(`✅ Uploaded: ${S.currentPath}`,'success');
  });
};

$('previewBtn').onclick = async () => {
  if (!S.currentPath) return toast('Select a file first','error');
  withLoading('previewBtn', async () => {
    const r = await api('/api/preview',{ method:'POST', json:{ path:S.currentPath, branch:S.branch } });
    if (r.error) throw new Error(r.error);
    showPreview(r.previewUrl);
    toast(`Preview ready`,'success');
  });
};

$('publishBtn').onclick = async () => {
  if (!S.currentPath) return toast('Select a file first','error');
  if (!confirm(`Publish "${S.currentPath}" to .aem.live?`)) return;
  withLoading('publishBtn', async () => {
    const r = await api('/api/publish',{ method:'POST', json:{ path:S.currentPath, branch:S.branch } });
    if (r.error) throw new Error(r.error);
    toast(`🌍 Published: ${r.liveUrl}`,'success');
  });
};

$('refreshFiles').onclick = () => loadFiles();
$('branchSelect').onchange = e => { S.branch = e.target.value; updateUrlBar(); };
$('clearChat').onclick = () => { S.chatHistory=[]; chatMessages.innerHTML=''; toast('Chat cleared','info'); };

/* ── Preview frame ──────────────────────────────────── */
function showPreview(url) {
  previewFrame.src = url;
  previewFrame.style.display = 'block';
  previewEmpty.style.display = 'none';
  $('urlText').textContent = url.replace('https://','');
}
function updateUrlBar() {
  if (!S.currentPath) return;
  const page = S.currentPath.replace(/\.html$/,'').replace(/^\//,'');
  $('urlText').textContent = `${S.branch}--${S.repo}--${S.org}.aem.page/${page}`;
}
function setViewport(mode) {
  previewFrame.classList.toggle('mobile', mode==='mobile');
  $('btnDesktop').classList.toggle('active', mode==='desktop');
  $('btnMobile').classList.toggle('active', mode==='mobile');
}
function refreshPreview() { if (previewFrame.src) previewFrame.src = previewFrame.src; }
function openExternal()   { if (previewFrame.src) window.open(previewFrame.src,'_blank'); }

/* ── Chat ───────────────────────────────────────────── */
chatInput.onkeydown = e => { if (e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); sendMessage(); } };
sendBtn.onclick = sendMessage;

async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;
  addMsg('user', text);
  S.chatHistory.push({ role:'user', content:text });
  chatInput.value = '';
  sendBtn.disabled = true;
  const typing = addTyping();
  try {
    const res = await fetch('/api/chat', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ messages:S.chatHistory, currentFile:S.currentPath, currentCode:S.currentContent }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error||'Chat failed'); }
    typing.remove();
    const { el: msgEl, bubble } = addMsg('assistant','');
    let full = '';
    await streamSSE(res, chunk => { full+=chunk; bubble.innerHTML = renderMarkdown(full); chatMessages.scrollTop=chatMessages.scrollHeight; });
    // apply button
    const match = full.match(/```(?:html)?\n([\s\S]*?)```/);
    if (match) {
      const btn = document.createElement('button');
      btn.className = 'apply-code-btn'; btn.textContent = '⚡ Apply to editor';
      btn.onclick = () => { codeEditor.value = match[1].trim(); S.currentContent = codeEditor.value; toast('Applied to editor','success'); };
      bubble.appendChild(btn);
    }
    S.chatHistory.push({ role:'assistant', content:full });
  } catch(e) {
    typing.remove(); addMsg('assistant',`❌ ${e.message}`);
  } finally { sendBtn.disabled=false; chatMessages.scrollTop=chatMessages.scrollHeight; }
}

function addMsg(role, text) {
  const el = document.createElement('div');
  el.className = `chat-msg ${role}`;
  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.textContent = role==='user' ? 'U' : 'AI';
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = role==='user' ? esc(text) : renderMarkdown(text);
  el.appendChild(avatar);
  el.appendChild(bubble);
  chatMessages.appendChild(el);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return { el, bubble };
}

function addTyping() {
  const el = document.createElement('div');
  el.className = 'chat-msg assistant';
  el.innerHTML = `<div class="avatar">AI</div><div class="bubble"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>`;
  chatMessages.appendChild(el);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return el;
}

/* ── Settings ───────────────────────────────────────── */
$('settingsBtn').onclick = () => $('settingsModal').classList.add('open');
function closeSettings() { $('settingsModal').classList.remove('open'); }

async function loadSettings() {
  const s = await api('/api/settings').catch(()=>({}));
  if (s.anthropicKey) $('s_anthropicKey').placeholder = s.anthropicKey;
  if (s.figmaToken)   $('s_figmaToken').placeholder   = s.figmaToken;
  if (s.cursorKey)    $('s_cursorKey').placeholder    = s.cursorKey;
  if (s.claudeModel)  $('s_claudeModel').value  = s.claudeModel;
  if (s.cursorModel)  $('s_cursorModel').value  = s.cursorModel;
  if (s.org)          $('s_org').value  = s.org;
  if (s.repo)         $('s_repo').value = s.repo;
  if (s.claudeModel)  $('modelBadge').textContent = s.claudeModel;
}

$('saveSettingsBtn').onclick = async () => {
  const body = {
    anthropicKey: $('s_anthropicKey').value || $('s_anthropicKey').placeholder,
    figmaToken:   $('s_figmaToken').value   || $('s_figmaToken').placeholder,
    cursorKey:    $('s_cursorKey').value     || $('s_cursorKey').placeholder,
    claudeModel:  $('s_claudeModel').value,
    cursorModel:  $('s_cursorModel').value,
    org:  $('s_org').value  || S.org,
    repo: $('s_repo').value || S.repo,
  };
  const r = await api('/api/settings',{ method:'POST', json:body });
  if (r.ok) {
    toast('Settings saved ✅','success');
    $('modelBadge').textContent = body.claudeModel;
    closeSettings();
  }
};

/* ── Figma ──────────────────────────────────────────── */
$('figmaBtn').onclick = () => $('figmaModal').classList.add('open');
function closeFigma() { $('figmaModal').classList.remove('open'); }

$('figmaFetchBtn').onclick = async () => {
  const url = $('figmaUrl').value.trim();
  if (!url) return toast('Paste a Figma URL first','error');
  withLoading('figmaFetchBtn', async () => {
    const r = await api('/api/figma/fetch',{ method:'POST', json:{ url } });
    if (r.error) throw new Error(r.error);
    S.figmaImageUrl = r.imageUrl;
    if (r.imageUrl) {
      $('figmaPreviewImg').src = r.imageUrl;
      $('figmaNodeName').textContent = r.nodeName || 'Component';
      $('figmaPreviewArea').style.display = 'block';
    }
    $('figmaGenerateBtn').disabled = !r.imageUrl;
    toast(`Fetched: ${r.nodeName || 'component'}`,'success');
  });
};

$('figmaGenerateBtn').onclick = async () => {
  if (!S.figmaImageUrl) return toast('Fetch a Figma design first','error');
  $('figmaGenerateBtn').disabled = true;
  $('figmaGeneratedArea').style.display = 'block';
  $('figmaGeneratedCode').textContent = '';
  try {
    const res = await fetch('/api/figma/generate',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        imageUrl: S.figmaImageUrl,
        nodeName: $('figmaNodeName').textContent,
        componentType: $('figmaComponentType').value,
        description: $('figmaDescription').value,
      }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    let full = '';
    await streamSSE(res, chunk => { full+=chunk; $('figmaGeneratedCode').textContent = full; });
    // strip code fences if present
    const match = full.match(/```(?:html)?\n?([\s\S]*?)```/);
    if (match) $('figmaGeneratedCode').textContent = match[1].trim();
    toast('Component generated!','success');
  } catch(e) {
    toast(e.message,'error');
  } finally { $('figmaGenerateBtn').disabled=false; }
};

$('applyFigmaCode').onclick = () => {
  const code = $('figmaGeneratedCode').textContent;
  if (!code) return;
  codeEditor.value = code; S.currentContent = code;
  closeFigma(); toast('Applied to editor ⚡','success');
};

/* ── Helpers ────────────────────────────────────────── */
async function api(url, opts={}) {
  const res = await fetch(url, {
    method: opts.method||'GET',
    headers: opts.json ? {'Content-Type':'application/json'} : {},
    body: opts.json ? JSON.stringify(opts.json) : undefined,
  });
  return res.json();
}

async function streamSSE(res, onChunk) {
  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of decoder.decode(value).split('\n')) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data==='[DONE]') return;
      try { const { text, error } = JSON.parse(data); if (error) throw new Error(error); if (text) onChunk(text); } catch {}
    }
  }
}

async function withLoading(btnId, fn) {
  const btn = $(btnId);
  const orig = btn.innerHTML;
  btn.disabled=true; btn.innerHTML='…';
  try { await fn(); } catch(e) { toast(e.message,'error'); } finally { btn.disabled=false; btn.innerHTML=orig; }
}

function renderMarkdown(text) {
  return text
    .replace(/```(?:html)?\n([\s\S]*?)```/g, (_,c)=>`<pre><code>${esc(c)}</code></pre>`)
    .replace(/`([^`]+)`/g, (_,c)=>`<code>${esc(c)}</code>`)
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\n/g,'<br>');
}

function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function toast(msg, type='info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`; el.textContent = msg;
  $('toasts').appendChild(el);
  setTimeout(()=>el.remove(), 3500);
}

init();
