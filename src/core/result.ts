import type { AppError } from './app-error.js';

export interface TextContentBlock {
  readonly type: 'text';
  readonly text: string;
}

export interface SuccessResult {
  readonly content: TextContentBlock[];
  readonly structuredContent?: Record<string, unknown>;
  readonly metadata: {
    readonly requestId: string;
    readonly toolName: string;
    readonly durationMs: number;
  };
}

export interface ErrorResult {
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

export function createTextContent(text: string): TextContentBlock {
  return { type: 'text', text };
}
