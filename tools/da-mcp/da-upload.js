import { execSync } from 'child_process';

const DA_UPLOAD_URL = 'https://aemcoder.adobe.io/api/aem/da/upload';

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
 * MCP Tool: Upload content files to Adobe Document Authoring (DA)
 *
 * Uploads one or more HTML content files to your AEM EDS site via the
 * DA upload API. The IMS Bearer token is retrieved automatically from
 * the aio CLI — no manual token needed.
 *
 * Use this tool when you need to:
 * - Push homepage or page content to DA for preview/publish
 * - Upload updated HTML content to your EDS site
 * - Sync local content files with the DA content source
 *
 * @param {Object} args
 * @param {Array<{source: string, target: string}>} args.files  - Files to upload
 * @param {string} args.org   - GitHub org (e.g. "surajpteamwass")
 * @param {string} args.repo  - GitHub repo (e.g. "aem-storefront")
 */
export default async function daUpload(args) {
  const { files, org, repo } = args;

  try {
    if (!files || !Array.isArray(files) || files.length === 0) {
      throw new Error('files must be a non-empty array of {source, target} objects');
    }
    if (!org) throw new Error('org is required');
    if (!repo) throw new Error('repo is required');

    console.error(`🔑 Retrieving IMS token from aio CLI...`);
    const token = getImsToken();
    console.error(`✅ IMS token retrieved`);

    console.error(`📤 Uploading ${files.length} file(s) to DA — ${org}/${repo}`);

    const response = await fetch(DA_UPLOAD_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ files, org, repo }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized: token expired. Please run: aio auth login');
      }
      if (response.status === 403) {
        throw new Error('Forbidden: you do not have access to this org/repo');
      }
      const body = await response.text().catch(() => '');
      throw new Error(`Upload failed (HTTP ${response.status}): ${body}`);
    }

    const result = await response.json().catch(() => ({ success: true }));
    console.error(`✅ Upload successful`);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              org,
              repo,
              files,
              response: result,
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
              files,
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
