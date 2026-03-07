import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

import { startStdioServer } from './mcp/server.js';
import { startStreamableHttpServer, type StreamableHttpOptions } from './mcp/streamable-http.js';

export type TransportType = 'stdio' | 'streamable-http';

export type TransportConfig =
  | { type: 'stdio' }
  | { type: 'streamable-http'; options: StreamableHttpOptions };

export type TransportResult = StdioServerTransport | StreamableHTTPServerTransport;

export async function createTransport(
  server: McpServer,
  config: TransportConfig,
): Promise<TransportResult> {
  if (config.type === 'stdio') {
    return startStdioServer(server);
  }

  return startStreamableHttpServer(server, config.options);
}
