import type { AppError } from './app-error.js';

export interface TextContentBlock {
  readonly type: 'text';
  readonly text: string;
}

export interface SuccessResult {
  readonly [key: string]: unknown;
  readonly isError: false;
  readonly content: TextContentBlock[];
  readonly structuredContent?: Record<string, unknown>;
  readonly metadata: {
    readonly requestId: string;
    readonly toolName: string;
    readonly durationMs: number;
  };
}

export interface ErrorResult {
  readonly [key: string]: unknown;
  readonly isError: true;
  readonly content: TextContentBlock[];
  readonly error: {
    readonly code: AppError['code'];
    readonly message: string;
  };
  readonly metadata: {
    readonly requestId: string;
    readonly toolName: string;
    readonly durationMs: number;
  };
}

export function isErrorResult(result: SuccessResult | ErrorResult): result is ErrorResult {
  return result.isError;
}

export function createTextContent(text: string): TextContentBlock {
  return { type: 'text', text };
}
