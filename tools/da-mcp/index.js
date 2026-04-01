import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import daUpload from './da-upload.js';

const TOOLS = [
  {
    name: 'da-upload',
    description: [
      'Upload HTML content files to Adobe Document Authoring (DA) via admin.da.live.',
      'Optionally trigger AEM preview (.aem.page) and publish (.aem.live) after upload.',
      'IMS Bearer token is auto-fetched from aio CLI — no manual token needed.',
      'Use this to push content so Lighthouse / PSI can audit it.',
    ].join(' '),
    inputSchema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          description: 'Files to upload. Each entry needs source (local path) and target (DA path).',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string', description: 'Local file path  (e.g. content/index.plain.html)' },
              target: { type: 'string', description: 'Target path in DA (e.g. index.html)' },
            },
            required: ['source', 'target'],
          },
        },
        org: {
          type: 'string',
          description: 'GitHub org name (e.g. surajpteamwass)',
          default: 'surajpteamwass',
        },
        repo: {
          type: 'string',
          description: 'GitHub repo name (e.g. aem-storefront)',
          default: 'aem-storefront',
        },
        branch: {
          type: 'string',
          description: 'Branch to preview/publish on (e.g. main, development)',
          default: 'main',
        },
        preview: {
          type: 'boolean',
          description: 'Trigger AEM preview (admin.aem.page) after upload. Default: true',
          default: true,
        },
        publish: {
          type: 'boolean',
          description: 'Trigger AEM publish (admin.aem.page/live) after upload. Default: false',
          default: false,
        },
      },
      required: ['files', 'org', 'repo'],
    },
  },
];

const server = new Server(
  { name: 'da-tools', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'da-upload') {
    return daUpload(args);
  }

  return {
    content: [{ type: 'text', text: `Unknown tool: ${name}` }],
  };
});

const transport = new StdioServerTransport();
server.connect(transport);
console.error('🚀 DA MCP server running');
