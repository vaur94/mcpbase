export type AppErrorCode =
  | 'CONFIG_ERROR'
  | 'VALIDATION_ERROR'
  | 'TOOL_NOT_FOUND'
  | 'TOOL_EXECUTION_ERROR'
  | 'PERMISSION_DENIED';

export class AppError extends Error {
  public readonly code: AppErrorCode;
  public readonly details?: Record<string, unknown>;
  public readonly expose: boolean;

  public constructor(
    code: AppErrorCode,
    message: string,
    options?: {
      details?: Record<string, unknown>;
      cause?: unknown;
      expose?: boolean;
    },
  ) {
    super(message, options?.cause ? { cause: options.cause } : undefined);
    this.name = 'AppError';
    this.code = code;
    this.details = options?.details;
    this.expose = options?.expose ?? true;
  }
}

export function ensureAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError('TOOL_EXECUTION_ERROR', error.message, {
      cause: error,
      expose: false,
    });
  }

  return new AppError('TOOL_EXECUTION_ERROR', 'An unknown application error occurred.', {
    details: { error },
    expose: false,
  });
}
