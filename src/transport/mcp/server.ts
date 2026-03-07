import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import type { ApplicationRuntime } from '../../application/runtime.js';
import type {
  ResourceDefinition,
  ResourceTemplateDefinition,
} from '../../capabilities/resources.js';
import type { PromptDefinition, PromptTemplateDefinition } from '../../capabilities/prompts.js';
import type { ToolDefinition } from '../../contracts/tool-contract.js';

import { registerResources, registerResourceTemplates } from '../../capabilities/resources.js';
import { registerPrompts, registerPromptTemplates } from '../../capabilities/prompts.js';

export interface McpServerOptions {
  resources?: ResourceDefinition[];
  resourceTemplates?: ResourceTemplateDefinition[];
  prompts?: PromptDefinition[];
  promptTemplates?: PromptTemplateDefinition[];
  enableLogging?: boolean;
  enableSampling?: boolean;
  enableRoots?: boolean;
}

function registerTool(server: McpServer, runtime: ApplicationRuntime, tool: ToolDefinition): void {
  const metadata = {
    title: tool.title,
    description: tool.description,
    inputSchema: tool.inputSchema,
    ...(tool.outputSchema ? { outputSchema: tool.outputSchema } : {}),
  };

  server.registerTool(tool.name, metadata, async (input) => runtime.executeTool(tool.name, input));
}

function buildCapabilities(options?: McpServerOptions): Record<string, object> {
  const capabilities: Record<string, object> = {};

  const hasResources =
    (options?.resources !== undefined && options.resources.length > 0) ||
    (options?.resourceTemplates !== undefined && options.resourceTemplates.length > 0);

  if (hasResources) {
    capabilities['resources'] = {};
  }

  const hasPrompts =
    (options?.prompts !== undefined && options.prompts.length > 0) ||
    (options?.promptTemplates !== undefined && options.promptTemplates.length > 0);

  if (hasPrompts) {
    capabilities['prompts'] = {};
  }

  if (options?.enableLogging === true) {
    capabilities['logging'] = {};
  }

  return capabilities;
}

export function createMcpServer(
  runtime: ApplicationRuntime,
  options?: McpServerOptions,
): McpServer {
  const server = new McpServer(
    {
      name: runtime.config.server.name,
      version: runtime.config.server.version,
    },
    {
      capabilities: buildCapabilities(options),
    },
  );

  for (const tool of runtime.listTools()) {
    registerTool(server, runtime, tool);
  }

  if (options?.resources !== undefined && options.resources.length > 0) {
    registerResources(server, options.resources);
  }

  if (options?.resourceTemplates !== undefined && options.resourceTemplates.length > 0) {
    registerResourceTemplates(server, options.resourceTemplates);
  }

  if (options?.prompts !== undefined && options.prompts.length > 0) {
    registerPrompts(server, options.prompts);
  }

  if (options?.promptTemplates !== undefined && options.promptTemplates.length > 0) {
    registerPromptTemplates(server, options.promptTemplates);
  }

  return server;
}

export async function startStdioServer(server: McpServer): Promise<StdioServerTransport> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  return transport;
}
