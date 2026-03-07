import { pathToFileURL } from 'node:url';

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
} from './contracts/runtime-config.js';
import type {
  ToolAnnotations,
  ToolInputSchema,
  ToolOutputSchema,
  ToolSuccessPayload,
} from './contracts/tool-contract.js';
import type { BaseToolExecutionContext, ToolExecutionContext } from './core/execution-context.js';
import type { ErrorResult, SuccessResult, TextContentBlock } from './core/result.js';
import { deepMerge } from './shared/merge.js';
import { createRequestId } from './shared/request-id.js';
import { sanitizeMessage } from './shared/text.js';
import { ensureAppError } from './core/app-error.js';
import type { Logger, LogEntry, LogLevel } from './logging/logger.js';
import { StderrLogger } from './logging/stderr-logger.js';
import { createMcpServer, startStdioServer } from './transport/mcp/server.js';

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

export async function bootstrap(argv: string[] = process.argv.slice(2)): Promise<void> {
  const config = await loadConfig(argv);
  const logger = new StderrLogger(config.logging);
  const runtime = new ApplicationRuntime({ config, logger, tools: createExampleTools() });
  const server = createMcpServer(runtime);

  await startStdioServer(server);
  logger.info('MCP stdio server is ready.', {
    toolName: 'bootstrap',
  });

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
