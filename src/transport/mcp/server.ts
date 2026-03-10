import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import type { ApplicationRuntime } from '../../application/runtime.js';
import type {
  ResourceDefinition,
  ResourceTemplateDefinition,
} from '../../capabilities/resources.js';
import type { PromptDefinition, PromptTemplateDefinition } from '../../capabilities/prompts.js';
import type { ToolDefinition } from '../../contracts/tool-contract.js';
import type { ToolStateManager } from '../../hub/tool-state.js';

import { registerResources, registerResourceTemplates } from '../../capabilities/resources.js';
import { registerPrompts, registerPromptTemplates } from '../../capabilities/prompts.js';
import { isErrorResult } from '../../core/result.js';

export interface McpServerOptions {
  resources?: ResourceDefinition[];
  resourceTemplates?: ResourceTemplateDefinition[];
  prompts?: PromptDefinition[];
  promptTemplates?: PromptTemplateDefinition[];
  enableLogging?: boolean;
  enableSampling?: boolean;
  enableRoots?: boolean;
}

export interface RegisteredToolHandle {
  readonly enabled: boolean;
  enable(): void;
  disable(): void;
  remove(): void;
}

export interface ManagedMcpServer {
  server: McpServer;
  toolHandles: ReadonlyMap<string, RegisteredToolHandle>;
}

function registerTool(
  server: McpServer,
  runtime: ApplicationRuntime,
  tool: ToolDefinition,
): RegisteredToolHandle {
  const metadata = {
    title: tool.title,
    description: tool.description,
    inputSchema: tool.inputSchema,
    ...(tool.outputSchema ? { outputSchema: tool.outputSchema } : {}),
    ...(tool.annotations ? { annotations: tool.annotations } : {}),
  };

  const handle = server.registerTool(tool.name, metadata, async (input) => {
    const result = await runtime.executeTool(tool.name, input);

    if (isErrorResult(result)) {
      return { content: result.content, isError: true };
    }

    return {
      content: result.content,
      ...(result.structuredContent !== undefined
        ? { structuredContent: result.structuredContent }
        : {}),
    };
  });

  return handle as RegisteredToolHandle;
}

function listToolsForRegistration(
  runtime: ApplicationRuntime,
  stateManager: ToolStateManager | undefined,
): Map<string, ToolDefinition> {
  const toolsByName = new Map<string, ToolDefinition>();

  for (const tool of runtime.listTools()) {
    toolsByName.set(tool.name, tool);
  }

  if (!stateManager) {
    return toolsByName;
  }

  for (const entry of stateManager.listStates()) {
    const tool = runtime.registry.tryGet(entry.name);
    if (tool) {
      toolsByName.set(tool.name, tool);
    }
  }

  return toolsByName;
}

function applyHandleStateFromManager(
  handle: RegisteredToolHandle,
  state: 'enabled' | 'disabled',
): void {
  if (state === 'enabled') {
    handle.enable();
    return;
  }

  handle.disable();
}

function ensureToolHandle(
  server: McpServer,
  runtime: ApplicationRuntime,
  toolDefinitions: ReadonlyMap<string, ToolDefinition>,
  toolHandles: Map<string, RegisteredToolHandle>,
  toolName: string,
): RegisteredToolHandle | undefined {
  const existingHandle = toolHandles.get(toolName);
  if (existingHandle) {
    return existingHandle;
  }

  const tool = toolDefinitions.get(toolName);
  if (!tool) {
    return undefined;
  }

  const handle = registerTool(server, runtime, tool);
  toolHandles.set(toolName, handle);
  return handle;
}

function syncToolHandleWithState(
  server: McpServer,
  runtime: ApplicationRuntime,
  toolDefinitions: ReadonlyMap<string, ToolDefinition>,
  toolHandles: Map<string, RegisteredToolHandle>,
  toolName: string,
  state: 'enabled' | 'disabled' | 'hidden',
): void {
  if (state === 'hidden') {
    const existingHandle = toolHandles.get(toolName);
    if (!existingHandle) {
      return;
    }

    existingHandle.remove();
    toolHandles.delete(toolName);
    return;
  }

  const handle = ensureToolHandle(server, runtime, toolDefinitions, toolHandles, toolName);
  if (!handle) {
    return;
  }

  applyHandleStateFromManager(handle, state);
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
  return createManagedMcpServer(runtime, options).server;
}

export function createManagedMcpServer(
  runtime: ApplicationRuntime,
  options?: McpServerOptions,
): ManagedMcpServer {
  const server = new McpServer(
    {
      name: runtime.config.server.name,
      version: runtime.config.server.version,
    },
    {
      capabilities: buildCapabilities(options),
    },
  );

  const toolHandles = new Map<string, RegisteredToolHandle>();
  const stateManager = runtime.registry.getStateManager();
  const toolDefinitions = listToolsForRegistration(runtime, stateManager);

  for (const [toolName, tool] of toolDefinitions) {
    const state = stateManager?.getState(toolName) ?? 'enabled';
    if (state === 'hidden') {
      continue;
    }

    const handle = registerTool(server, runtime, tool);
    toolHandles.set(tool.name, handle);

    if (stateManager) {
      applyHandleStateFromManager(handle, state);
    }
  }

  if (stateManager) {
    stateManager.onChange((toolName, state) => {
      syncToolHandleWithState(server, runtime, toolDefinitions, toolHandles, toolName, state);
    });
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

  return { server, toolHandles };
}

export async function startStdioServer(server: McpServer): Promise<StdioServerTransport> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  return transport;
}
