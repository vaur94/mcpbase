import { pathToFileURL } from 'node:url';

import type { ZodSchema } from 'zod';

import { ApplicationRuntime } from './application/runtime.js';
import { createExampleTools } from './application/example-tools.js';
import { ToolRegistry } from './application/tool-registry.js';
import { baseDefaultConfig, defaultConfig } from './config/default-config.js';
import { loadConfig } from './config/load-config.js';
import {
  baseLoggingSchema,
  baseRuntimeConfigSchema,
  baseServerSchema,
  createPartialRuntimeConfigSchema,
  createRuntimeConfigSchema,
  logLevelSchema,
  runtimeConfigSchema,
} from './contracts/runtime-config.js';
import type {
  ToolAnnotations,
  ToolDefinition,
  ToolInputSchema,
  ToolOutputSchema,
  ToolSuccessPayload,
} from './contracts/tool-contract.js';
import type { ExecutionHooks } from './contracts/hooks.js';
import type { BaseRuntimeConfig } from './contracts/runtime-config.js';
import type { BaseToolExecutionContext, ToolExecutionContext } from './core/execution-context.js';
import type { ErrorResult, SuccessResult, TextContentBlock } from './core/result.js';
import { deepMerge } from './shared/merge.js';
import { createRequestId } from './shared/request-id.js';
import { sanitizeMessage } from './shared/text.js';
import { ensureAppError } from './core/app-error.js';
import type { Logger, LogEntry, LogLevel } from './logging/logger.js';
import { StderrLogger } from './logging/stderr-logger.js';
import { createMcpServer, startStdioServer } from './transport/mcp/server.js';
import { startStreamableHttpServer } from './transport/mcp/streamable-http.js';

export interface BootstrapOptions<
  TConfig extends BaseRuntimeConfig = BaseRuntimeConfig,
  TContext extends BaseToolExecutionContext<TConfig> = BaseToolExecutionContext<TConfig>,
> {
  configSchema?: ZodSchema<TConfig>;
  tools?: ToolDefinition<any, any, TContext>[] | (() => ToolDefinition<any, any, TContext>[]);
  loggerFactory?: (config: TConfig) => Logger;
  contextFactory?: (toolName: string, requestId: string, config: TConfig) => TContext;
  hooks?: ExecutionHooks<TContext> | ExecutionHooks<TContext>[];
  transport?: 'stdio';
  argv?: string[];
}

export { ApplicationRuntime } from './application/runtime.js';
export type { RuntimeOptions } from './application/runtime.js';
export { createExampleTools } from './application/example-tools.js';
export { ToolRegistry } from './application/tool-registry.js';
export { loadConfig } from './config/load-config.js';
export { ensureAppError } from './core/app-error.js';
export { createTextContent } from './core/result.js';
export { StderrLogger } from './logging/stderr-logger.js';
export {
  assertAllowedCommand,
  assertAllowedPath,
  assertFeatureEnabled,
} from './security/guards.js';

export {
  baseLoggingSchema,
  baseRuntimeConfigSchema,
  baseServerSchema,
  createPartialRuntimeConfigSchema,
  createRuntimeConfigSchema,
  logLevelSchema,
  runtimeConfigSchema,
} from './contracts/runtime-config.js';

export { baseDefaultConfig, defaultConfig } from './config/default-config.js';

export { deepMerge } from './shared/merge.js';
export { createRequestId } from './shared/request-id.js';
export { sanitizeMessage } from './shared/text.js';

export type { Logger, LogEntry, LogLevel } from './logging/logger.js';

export type {
  BaseRuntimeConfig,
  RuntimeConfig,
  PartialRuntimeConfig,
} from './contracts/runtime-config.js';

export type {
  ToolDefinition,
  ToolInputSchema,
  ToolOutputSchema,
  ToolAnnotations,
  ToolSuccessPayload,
} from './contracts/tool-contract.js';

export type { BaseToolExecutionContext, ToolExecutionContext } from './core/execution-context.js';

export type { AppErrorCode, BaseAppErrorCode } from './core/app-error.js';
export { AppError } from './core/app-error.js';

export type { TextContentBlock, SuccessResult, ErrorResult } from './core/result.js';

export type { ExecutionHooks } from './contracts/hooks.js';

export type { ResourceDefinition, ResourceTemplateDefinition } from './capabilities/resources.js';
export { registerResources, registerResourceTemplates } from './capabilities/resources.js';

export type {
  PromptDefinition,
  PromptMessage,
  PromptTemplateDefinition,
} from './capabilities/prompts.js';
export { registerPrompts, registerPromptTemplates } from './capabilities/prompts.js';

export type { McpLogLevel, McpLoggingBridge } from './capabilities/logging.js';
export { createMcpLoggingBridge } from './capabilities/logging.js';

export type { SamplingRequest, SamplingResponse, SamplingHelper } from './capabilities/sampling.js';
export { createSamplingHelper } from './capabilities/sampling.js';

export type { Root, RootsChangeHandler, RootsHandler } from './capabilities/roots.js';
export { createRootsHandler } from './capabilities/roots.js';

export type { StreamableHttpOptions } from './transport/mcp/streamable-http.js';
export { startStreamableHttpServer } from './transport/mcp/streamable-http.js';

export async function bootstrap<
  TConfig extends BaseRuntimeConfig = BaseRuntimeConfig,
  TContext extends BaseToolExecutionContext<TConfig> = BaseToolExecutionContext<TConfig>,
>(options?: BootstrapOptions<TConfig, TContext>): Promise<void> {
  const schema = (options?.configSchema ?? runtimeConfigSchema) as ZodSchema<TConfig>;
  const argv = options?.argv ?? process.argv.slice(2);

  const config = await loadConfig(schema, { argv });

  const logger = options?.loggerFactory
    ? options.loggerFactory(config)
    : new StderrLogger((config as BaseRuntimeConfig).logging);

  const rawTools = options?.tools;
  const tools: ToolDefinition<any, any, TContext>[] = rawTools
    ? typeof rawTools === 'function'
      ? rawTools()
      : rawTools
    : (createExampleTools() as unknown as ToolDefinition<any, any, TContext>[]);

  const runtime = new ApplicationRuntime<TConfig, TContext>({
    config,
    logger,
    tools,
    contextFactory: options?.contextFactory,
    hooks: options?.hooks,
  });

  const server = createMcpServer(runtime);
  await startStdioServer(server);

  logger.info('MCP stdio server is ready.', { toolName: 'bootstrap' });

  const shutdown = (signal: NodeJS.Signals) => {
    logger.info('Shutdown signal received.', { toolName: signal });
    process.exit(0);
  };

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

async function main(): Promise<void> {
  try {
    await bootstrap();
  } catch (error) {
    const appError = ensureAppError(error);
    const logger = new StderrLogger({ level: 'error', includeTimestamp: true });
    logger.error(appError.message, { errorCode: appError.code, toolName: 'bootstrap' });
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main();
}
