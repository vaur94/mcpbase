import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import type { ApplicationRuntime } from '../../application/runtime.js';
import type { ToolDefinition } from '../../contracts/tool-contract.js';

function registerTool(server: McpServer, runtime: ApplicationRuntime, tool: ToolDefinition): void {
  const metadata = {
    title: tool.title,
    description: tool.description,
    inputSchema: tool.inputSchema,
    ...(tool.outputSchema ? { outputSchema: tool.outputSchema } : {}),
  };

  server.registerTool(tool.name, metadata, async (input) => runtime.executeTool(tool.name, input));
}

export function createMcpServer(runtime: ApplicationRuntime): McpServer {
  const server = new McpServer(
    {
      name: runtime.config.server.name,
      version: runtime.config.server.version,
    },
    {
      capabilities: {
        logging: {},
      },
    },
  );

  for (const tool of runtime.listTools()) {
    registerTool(server, runtime, tool);
  }

  return server;
}

export async function startStdioServer(server: McpServer): Promise<StdioServerTransport> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  return transport;
}
