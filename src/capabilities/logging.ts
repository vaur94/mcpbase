import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export type McpLogLevel =
  | 'debug'
  | 'info'
  | 'notice'
  | 'warning'
  | 'error'
  | 'critical'
  | 'alert'
  | 'emergency';

export interface McpLoggingBridge {
  log(level: McpLogLevel, logger: string, data: unknown): void;
  setLevel(level: McpLogLevel): void;
}

const severityOrder: Record<McpLogLevel, number> = {
  debug: 10,
  info: 20,
  notice: 30,
  warning: 40,
  error: 50,
  critical: 60,
  alert: 70,
  emergency: 80,
};

class DefaultMcpLoggingBridge implements McpLoggingBridge {
  private level: McpLogLevel = 'debug';

  public constructor(private readonly server: McpServer) {}

  public log(level: McpLogLevel, logger: string, data: unknown): void {
    if (severityOrder[level] < severityOrder[this.level]) {
      return;
    }

    void this.server.server.sendLoggingMessage({
      level,
      logger,
      data,
    });
  }

  public setLevel(level: McpLogLevel): void {
    this.level = level;
  }
}

export function createMcpLoggingBridge(server: McpServer): McpLoggingBridge {
  return new DefaultMcpLoggingBridge(server);
}
