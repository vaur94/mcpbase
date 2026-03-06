import type { z } from 'zod';

import type { ToolExecutionContext } from '../core/execution-context.js';
import type { TextContentBlock } from '../core/result.js';
import type { RuntimeConfig } from './runtime-config.js';

export type ToolInputSchema = z.ZodObject<z.ZodRawShape>;
export type ToolOutputSchema = z.ZodObject<z.ZodRawShape>;

export interface ToolSecurityDefinition {
  readonly requiredFeature?: keyof RuntimeConfig['security']['features'];
}

export interface ToolSuccessPayload {
  readonly content: TextContentBlock[];
  readonly structuredContent?: Record<string, unknown>;
}

export interface ToolDefinition<
  TInput extends ToolInputSchema = ToolInputSchema,
  TOutput extends ToolOutputSchema | undefined = ToolOutputSchema | undefined,
> {
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly inputSchema: TInput;
  readonly outputSchema?: TOutput;
  readonly security?: ToolSecurityDefinition;
  execute(input: z.infer<TInput>, context: ToolExecutionContext): Promise<ToolSuccessPayload>;
}
