import type { z } from 'zod';

import type { BaseToolExecutionContext } from '../core/execution-context.js';
import type { TextContentBlock } from '../core/result.js';

export type ToolInputSchema = z.ZodObject<z.ZodRawShape>;
export type ToolOutputSchema = z.ZodObject<z.ZodRawShape>;

export interface ToolSuccessPayload {
  readonly content: TextContentBlock[];
  readonly structuredContent?: Record<string, unknown>;
}

export interface ToolAnnotations {
  readonly title?: string;
  readonly readOnlyHint?: boolean;
  readonly destructiveHint?: boolean;
  readonly idempotentHint?: boolean;
  readonly openWorldHint?: boolean;
}

export interface ToolDefinition<
  TInput extends ToolInputSchema = ToolInputSchema,
  TOutput extends ToolOutputSchema | undefined = ToolOutputSchema | undefined,
  TContext extends BaseToolExecutionContext = BaseToolExecutionContext,
> {
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly inputSchema: TInput;
  readonly outputSchema?: TOutput;
  readonly annotations?: ToolAnnotations;
  execute(input: z.infer<TInput>, context: TContext): Promise<ToolSuccessPayload>;
}
