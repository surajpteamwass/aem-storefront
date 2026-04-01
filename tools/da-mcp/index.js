import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import daUpload from './da-upload.js';

const TOOLS = [
  {
    name: 'da-upload',
    description: 'Upload HTML content files to Adobe Document Authoring (DA) for your AEM EDS site. Automatically retrieves the IMS Bearer token from aio CLI.',
    inputSchema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          description: 'Files to upload. Each entry needs a source (local path) and target (DA path).',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string', description: 'Local file path (e.g. content/index.plain.html)' },
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
