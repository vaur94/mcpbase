import process from 'node:process';

import type { RuntimeConfig } from '../contracts/runtime-config.js';
import { sanitizeMessage } from '../shared/text.js';
import type { LogEntry, LogLevel, Logger } from './logger.js';

const severityOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export class StderrLogger implements Logger {
  public constructor(private readonly config: RuntimeConfig['logging']) {}

  public log(entry: LogEntry): void {
    if (severityOrder[entry.level] < severityOrder[this.config.level]) {
      return;
    }

    const payload = {
      level: entry.level,
      message: sanitizeMessage(entry.message),
      requestId: entry.requestId,
      toolName: entry.toolName,
      durationMs: entry.durationMs,
      errorCode: entry.errorCode,
      timestamp: this.config.includeTimestamp
        ? (entry.timestamp ?? new Date().toISOString())
        : undefined,
    };

    process.stderr.write(`${JSON.stringify(payload)}\n`);
  }

  public debug(message: string, meta: Omit<LogEntry, 'level' | 'message'> = {}): void {
    this.log({ ...meta, level: 'debug', message });
  }

  public info(message: string, meta: Omit<LogEntry, 'level' | 'message'> = {}): void {
    this.log({ ...meta, level: 'info', message });
  }

  public warn(message: string, meta: Omit<LogEntry, 'level' | 'message'> = {}): void {
    this.log({ ...meta, level: 'warn', message });
  }

  public error(message: string, meta: Omit<LogEntry, 'level' | 'message'> = {}): void {
    this.log({ ...meta, level: 'error', message });
  }
}
