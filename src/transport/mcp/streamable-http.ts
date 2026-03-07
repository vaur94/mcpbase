import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

import type { IncomingMessage, ServerResponse } from 'node:http';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export interface StreamableHttpOptions {
  req: IncomingMessage;
  res: ServerResponse;
  sessionId?: string;
  parsedBody?: unknown;
}

export async function startStreamableHttpServer(
  server: McpServer,
  options: StreamableHttpOptions,
): Promise<StreamableHTTPServerTransport> {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: options.sessionId ? () => options.sessionId! : undefined,
  });

  await server.connect(transport);
  await transport.handleRequest(options.req, options.res, options.parsedBody);

  return transport;
}
