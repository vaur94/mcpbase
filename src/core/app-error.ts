export type BaseAppErrorCode =
  | 'CONFIG_ERROR'
  | 'VALIDATION_ERROR'
  | 'TOOL_NOT_FOUND'
  | 'TOOL_EXECUTION_ERROR';

export type AppErrorCode = BaseAppErrorCode | 'PERMISSION_DENIED';

export class AppError<TCode extends string = BaseAppErrorCode> extends Error {
  public readonly code: TCode;
  public readonly details?: Record<string, unknown>;
  public readonly expose: boolean;

  public constructor(
    code: TCode,
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

export function ensureAppError<TCode extends string>(error: unknown): AppError<TCode> {
  if (error instanceof AppError) {
    return error as AppError<TCode>;
  }

  const baseError = new AppError<BaseAppErrorCode>(
    'TOOL_EXECUTION_ERROR',
    error instanceof Error ? error.message : 'An unknown application error occurred.',
    {
      cause: error instanceof Error ? error : undefined,
      details: error instanceof Error ? undefined : { error },
      expose: false,
    },
  );

  return baseError as AppError<TCode>;
}
