import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { Blob } from 'buffer';
import FormData from 'form-data';

const DA_ADMIN_BASE  = 'https://admin.da.live';
const AEM_ADMIN_BASE = 'https://admin.aem.page';

/**
 * Get IMS access token from aio CLI
 */
function getImsToken() {
  try {
    const token = execSync('aio config get ims.contexts.cli.access_token.token', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    if (!token) throw new Error('Empty token');
    return token;
  } catch {
    throw new Error('Failed to get IMS token. Please run: aio auth login');
  }
}

/**
 * Upload a single file to DA via admin.da.live
 * POST /source/{org}/{repo}/{target}  — multipart/form-data, field: data
 */
async function uploadFile(org, repo, source, target, token) {
  if (!existsSync(source)) {
    throw new Error(`Source file not found: ${source}`);
  }

  const fileContent = readFileSync(source);
  const form = new FormData();
  form.append('data', fileContent, { filename: target, contentType: 'text/html' });

  const url = `${DA_ADMIN_BASE}/source/${org}/${repo}/${target}`;
  console.error(`📤 Uploading ${source} → ${url}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      ...form.getHeaders(),
    },
    body: form.getBuffer(),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Upload failed for ${target} (HTTP ${response.status}): ${body}`);
  }

  console.error(`✅ Uploaded: ${target}`);
  return target;
}

/**
 * Trigger AEM preview for a path
 * POST https://admin.aem.page/preview/{org}/{repo}/{branch}/{path}
 */
async function triggerPreview(org, repo, branch, path, token) {
  const url = `${AEM_ADMIN_BASE}/preview/${org}/${repo}/${branch}/${path}`;
  console.error(`👁  Previewing: ${url}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    console.error(`⚠️  Preview failed for ${path} (HTTP ${response.status})`);
    return false;
  }

  console.error(`✅ Previewed: ${path}`);
  return true;
}

/**
 * Trigger AEM publish (live) for a path
 * POST https://admin.aem.page/live/{org}/{repo}/{branch}/{path}
 */
async function triggerPublish(org, repo, branch, path, token) {
  const url = `${AEM_ADMIN_BASE}/live/${org}/${repo}/${branch}/${path}`;
  console.error(`🌍 Publishing: ${url}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    console.error(`⚠️  Publish failed for ${path} (HTTP ${response.status})`);
    return false;
  }

  console.error(`✅ Published: ${path}`);
  return true;
}

/**
 * MCP Tool: Upload content to DA and optionally preview/publish
 *
 * Uploads HTML files to Adobe Document Authoring (DA) via admin.da.live,
 * then optionally triggers AEM preview (.aem.page) and publish (.aem.live).
 * Bearer token is auto-fetched from aio CLI.
 *
 * @param {Object} args
 * @param {Array<{source: string, target: string}>} args.files   - Files to upload
 * @param {string} args.org     - GitHub org  (e.g. "surajpteamwass")
 * @param {string} args.repo    - GitHub repo (e.g. "aem-storefront")
 * @param {string} [args.branch="main"] - Branch to preview/publish on
 * @param {boolean} [args.preview=true]  - Trigger AEM preview after upload
 * @param {boolean} [args.publish=false] - Trigger AEM publish after upload
 */
export default async function daUpload(args) {
  const {
    files,
    org,
    repo,
    branch = 'main',
    preview = true,
    publish = false,
  } = args;

  try {
    if (!files || !Array.isArray(files) || files.length === 0) {
      throw new Error('files must be a non-empty array of {source, target} objects');
    }
    if (!org)  throw new Error('org is required');
    if (!repo) throw new Error('repo is required');

    console.error(`🔑 Retrieving IMS token from aio CLI...`);
    const token = getImsToken();
    console.error(`✅ IMS token retrieved`);

    const results = [];

    for (const { source, target } of files) {
      const uploaded = await uploadFile(org, repo, source, target, token);

      const entry = { source, target: uploaded, uploaded: true, previewed: false, published: false };

      if (preview) {
        entry.previewed = await triggerPreview(org, repo, branch, target, token);
      }
      if (publish) {
        entry.published = await triggerPublish(org, repo, branch, target, token);
      }

      results.push(entry);
    }

    const previewBase = `https://${branch}--${repo}--${org}.aem.page`;
    const liveBase    = `https://${branch}--${repo}--${org}.aem.live`;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              org,
              repo,
              branch,
              files: results,
              urls: {
                preview: previewBase,
                live: liveBase,
              },
              timestamp: new Date().toISOString(),
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    console.error(`❌ DA upload failed: ${error.message}`);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: false,
              error: error.message,
              org,
              repo,
              timestamp: new Date().toISOString(),
            },
            null,
            2
          ),
        },
      ],
    };
  }
}
