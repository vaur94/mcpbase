export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  readonly level: LogLevel;
  readonly message: string;
  readonly requestId?: string;
  readonly toolName?: string;
  readonly durationMs?: number;
  readonly errorCode?: string;
  readonly timestamp?: string;
}

export interface Logger {
  log(entry: LogEntry): void;
  debug(message: string, meta?: Omit<LogEntry, 'level' | 'message'>): void;
  info(message: string, meta?: Omit<LogEntry, 'level' | 'message'>): void;
  warn(message: string, meta?: Omit<LogEntry, 'level' | 'message'>): void;
  error(message: string, meta?: Omit<LogEntry, 'level' | 'message'>): void;
}
