import { pathToFileURL } from 'node:url';

import { ApplicationRuntime } from './application/runtime.js';
import { createExampleTools } from './application/example-tools.js';
import { loadConfig } from './config/load-config.js';
import { ensureAppError } from './core/app-error.js';
import { StderrLogger } from './logging/stderr-logger.js';
import { createMcpServer, startStdioServer } from './transport/mcp/server.js';

export { ApplicationRuntime } from './application/runtime.js';
export { createExampleTools } from './application/example-tools.js';
export { loadConfig } from './config/load-config.js';
export { AppError } from './core/app-error.js';
export { createTextContent } from './core/result.js';
export { StderrLogger } from './logging/stderr-logger.js';
export {
  assertAllowedCommand,
  assertAllowedPath,
  assertFeatureEnabled,
} from './security/guards.js';
export type { RuntimeConfig } from './contracts/runtime-config.js';
export type { ToolDefinition } from './contracts/tool-contract.js';

export async function bootstrap(argv: string[] = process.argv.slice(2)): Promise<void> {
  const config = await loadConfig(argv);
  const logger = new StderrLogger(config.logging);
  const runtime = new ApplicationRuntime(config, logger, createExampleTools());
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
