import express from 'express';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import FormData from 'form-data';
import Anthropic from '@anthropic-ai/sdk';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SETTINGS_FILE = join(__dirname, 'settings.json');
const app = express();
app.use(express.json({ limit: '4mb' }));
app.use(express.static(join(__dirname, 'public')));

/* ─── Settings ─────────────────────────────────────── */
function loadSettings() {
  if (!existsSync(SETTINGS_FILE)) return {};
  try { return JSON.parse(readFileSync(SETTINGS_FILE, 'utf8')); } catch { return {}; }
}
function saveSettings(data) {
  writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2));
}

app.get('/api/settings', (_, res) => {
  const s = loadSettings();
  // mask secrets in response
  const masked = { ...s };
  if (masked.anthropicKey) masked.anthropicKey = masked.anthropicKey.slice(0, 8) + '••••••••';
  if (masked.figmaToken)   masked.figmaToken   = masked.figmaToken.slice(0, 8)   + '••••••••';
  if (masked.cursorKey)    masked.cursorKey    = masked.cursorKey.slice(0, 8)    + '••••••••';
  res.json(masked);
});

app.post('/api/settings', (req, res) => {
  const current = loadSettings();
  const updated = { ...current };
  const fields = ['anthropicKey','figmaToken','cursorKey','cursorModel','org','repo'];
  fields.forEach(f => { if (req.body[f] !== undefined && !req.body[f].includes('••')) updated[f] = req.body[f]; });
  saveSettings(updated);
  res.json({ ok: true });
});

/* ─── Helpers ──────────────────────────────────────── */
function getSettings() { return loadSettings(); }

function getAnthropic() {
  const key = getSettings().anthropicKey || process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('Anthropic API key not set. Add it in ⚙ Settings.');
  return new Anthropic({ apiKey: key });
}

function getImsToken() {
  try {
    return execSync('aio config get ims.contexts.cli.access_token.token', {
      encoding: 'utf8', stdio: ['pipe','pipe','pipe'],
    }).trim();
  } catch {
    throw new Error('IMS token not found. Run: aio auth login');
  }
}

function getOrg()  { return getSettings().org  || process.env.AEM_ORG  || 'surajpteamwass'; }
function getRepo() { return getSettings().repo || process.env.AEM_REPO || 'aem-storefront'; }

const DA_ADMIN  = 'https://admin.da.live';
const AEM_ADMIN = 'https://admin.aem.page';
const FIGMA_API = 'https://api.figma.com/v1';

/* ─── DA: list ─────────────────────────────────────── */
app.get('/api/files', async (req, res) => {
  try {
    const token = getImsToken();
    const path  = req.query.path || '';
    const url   = `${DA_ADMIN}/list/${getOrg()}/${getRepo()}${path ? '/'+path : ''}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) return res.status(r.status).json({ error: `DA list failed (${r.status})` });
    res.json(await r.json());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ─── DA: get content ──────────────────────────────── */
app.get('/api/content', async (req, res) => {
  try {
    const { path } = req.query;
    if (!path) return res.status(400).json({ error: 'path required' });
    const token = getImsToken();
    const r = await fetch(`${DA_ADMIN}/source/${getOrg()}/${getRepo()}/${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return res.status(r.status).json({ error: `DA get failed (${r.status})` });
    res.json({ content: await r.text(), path });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ─── DA: upload ───────────────────────────────────── */
app.post('/api/upload', async (req, res) => {
  try {
    const { path, content } = req.body;
    if (!path || content === undefined) return res.status(400).json({ error: 'path + content required' });
    const token = getImsToken();
    const form  = new FormData();
    form.append('data', Buffer.from(content, 'utf8'), { filename: path.split('/').pop(), contentType: 'text/html' });
    const r = await fetch(`${DA_ADMIN}/source/${getOrg()}/${getRepo()}/${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, ...form.getHeaders() },
      body: form.getBuffer(),
    });
    if (!r.ok) { const t = await r.text().catch(()=>''); return res.status(r.status).json({ error: `Upload failed (${r.status}): ${t}` }); }
    res.json(await r.json());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ─── AEM: preview ─────────────────────────────────── */
app.post('/api/preview', async (req, res) => {
  try {
    const { path, branch = 'main' } = req.body;
    if (!path) return res.status(400).json({ error: 'path required' });
    const token = getImsToken();
    const r = await fetch(`${AEM_ADMIN}/preview/${getOrg()}/${getRepo()}/${branch}/${path}`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` },
    });
    res.json({ ok: r.ok, status: r.status, previewUrl: `https://${branch}--${getRepo()}--${getOrg()}.aem.page/${path}` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ─── AEM: publish ─────────────────────────────────── */
app.post('/api/publish', async (req, res) => {
  try {
    const { path, branch = 'main' } = req.body;
    if (!path) return res.status(400).json({ error: 'path required' });
    const token = getImsToken();
    const r = await fetch(`${AEM_ADMIN}/live/${getOrg()}/${getRepo()}/${branch}/${path}`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` },
    });
    res.json({ ok: r.ok, status: r.status, liveUrl: `https://${branch}--${getRepo()}--${getOrg()}.aem.live/${path}` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ─── Claude AI chat (streaming) ───────────────────── */
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, currentFile, currentCode } = req.body;
    if (!messages?.length) return res.status(400).json({ error: 'messages required' });

    const system = [
      'You are an AEM Edge Delivery Services (EDS) developer assistant embedded in AEM Studio.',
      'Help write, edit, and fix HTML content for AEM EDS pages. Be concise.',
      'When generating code wrap it in ```html code blocks so the user can apply it to the editor.',
      currentFile ? `Current file open: ${currentFile}` : '',
      currentCode ? `Current file content:\n\`\`\`html\n${currentCode}\n\`\`\`` : '',
    ].filter(Boolean).join('\n');

    res.setHeader('Content-Type','text/event-stream');
    res.setHeader('Cache-Control','no-cache');
    res.setHeader('Connection','keep-alive');

    const stream = getAnthropic().messages.stream({
      model: getSettings().claudeModel || 'claude-sonnet-4-6',
      max_tokens: 4096,
      system,
      messages,
    });

    stream.on('text', t  => res.write(`data: ${JSON.stringify({text:t})}\n\n`));
    stream.on('finalMessage', () => { res.write('data: [DONE]\n\n'); res.end(); });
    stream.on('error', e  => { res.write(`data: ${JSON.stringify({error:e.message})}\n\n`); res.end(); });
  } catch (e) {
    res.setHeader('Content-Type','application/json');
    res.status(500).json({ error: e.message });
  }
});

/* ─── Figma: fetch node ────────────────────────────── */
app.post('/api/figma/fetch', async (req, res) => {
  try {
    const { url } = req.body;
    const figmaToken = getSettings().figmaToken;
    if (!figmaToken || figmaToken.includes('••')) throw new Error('Figma token not set. Add it in ⚙ Settings.');

    // Parse Figma URL  e.g. https://www.figma.com/file/ABC123/MyFile?node-id=1:2
    const match = url.match(/figma\.com\/(?:file|design)\/([A-Za-z0-9]+)/);
    if (!match) throw new Error('Invalid Figma URL. Expected: figma.com/file/KEY or figma.com/design/KEY');
    const fileKey = match[1];

    const nodeMatch = url.match(/node-id=([^&]+)/);
    const nodeId    = nodeMatch ? decodeURIComponent(nodeMatch[1]) : null;

    // Fetch file/node metadata
    const metaUrl = nodeId
      ? `${FIGMA_API}/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}`
      : `${FIGMA_API}/files/${fileKey}`;
    const metaR = await fetch(metaUrl, { headers: { 'X-Figma-Token': figmaToken } });
    if (!metaR.ok) {
      const err = await metaR.json().catch(()=>({}));
      throw new Error(`Figma API error (${metaR.status}): ${err.message || metaR.statusText}`);
    }
    const meta = await metaR.json();

    // Fetch image render (PNG) if node selected
    let imageUrl = null;
    if (nodeId) {
      const imgR = await fetch(
        `${FIGMA_API}/images/${fileKey}?ids=${encodeURIComponent(nodeId)}&format=png&scale=2`,
        { headers: { 'X-Figma-Token': figmaToken } }
      );
      if (imgR.ok) {
        const imgData = await imgR.json();
        imageUrl = imgData.images?.[nodeId.replace('-',':')] || Object.values(imgData.images||{})[0];
      }
    }

    // Extract component name
    const nodeName = nodeId
      ? meta.nodes?.[nodeId.replace(':','-')]?.document?.name || meta.nodes?.[Object.keys(meta.nodes)[0]]?.document?.name
      : meta.name;

    res.json({ ok: true, fileKey, nodeId, nodeName, imageUrl, meta: nodeId ? meta.nodes : { name: meta.name } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ─── Figma: generate component via Claude ─────────── */
app.post('/api/figma/generate', async (req, res) => {
  try {
    const { imageUrl, nodeName, componentType = 'block', description } = req.body;
    if (!imageUrl) return res.status(400).json({ error: 'imageUrl required' });

    res.setHeader('Content-Type','text/event-stream');
    res.setHeader('Cache-Control','no-cache');
    res.setHeader('Connection','keep-alive');

    // Download the Figma image and convert to base64
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error('Failed to fetch Figma image');
    const imgBuf    = Buffer.from(await imgRes.arrayBuffer());
    const imgBase64 = imgBuf.toString('base64');

    const prompt = [
      `Generate a clean AEM Edge Delivery Services (EDS) HTML ${componentType} that matches this Figma design.`,
      nodeName    ? `Component name: "${nodeName}".` : '',
      description ? `Additional notes: ${description}` : '',
      '',
      'Rules:',
      '- Output complete, self-contained HTML with inline <style> for the component',
      '- Use CSS custom properties (var(--color-brand-500), var(--spacing-medium) etc) for theming',
      '- Follow AEM EDS block structure: outer div with class matching component name',
      '- Keep it lightweight — no external dependencies, no frameworks',
      '- Respond ONLY with the HTML code block, no explanation needed',
    ].filter(Boolean).join('\n');

    const stream = getAnthropic().messages.stream({
      model: getSettings().claudeModel || 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/png', data: imgBase64 } },
          { type: 'text', text: prompt },
        ],
      }],
    });

    stream.on('text', t  => res.write(`data: ${JSON.stringify({text:t})}\n\n`));
    stream.on('finalMessage', () => { res.write('data: [DONE]\n\n'); res.end(); });
    stream.on('error', e  => { res.write(`data: ${JSON.stringify({error:e.message})}\n\n`); res.end(); });
  } catch (e) {
    res.write(`data: ${JSON.stringify({error:e.message})}\n\n`);
    res.end();
  }
});

/* ─── Config ───────────────────────────────────────── */
app.get('/api/config', (_, res) => res.json({ org: getOrg(), repo: getRepo() }));

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`\n╔════════════════════════════════════╗`);
  console.log(`║  🚀 AEM Studio                     ║`);
  console.log(`║  http://localhost:${PORT}            ║`);
  console.log(`╚════════════════════════════════════╝\n`);
});
