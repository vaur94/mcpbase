import type { AppError } from '../core/app-error.js';
import type { BaseRuntimeConfig } from '../contracts/runtime-config.js';
import type { BaseToolExecutionContext } from '../core/execution-context.js';
import type {
  ToolDefinition,
  ToolInputSchema,
  ToolOutputSchema,
  ToolSuccessPayload,
} from '../contracts/tool-contract.js';

export interface ExecutionHooks<
  TContext extends BaseToolExecutionContext = BaseToolExecutionContext,
> {
  beforeExecute?(
    tool: ToolDefinition<ToolInputSchema, ToolOutputSchema | undefined, TContext>,
    input: unknown,
    context: TContext,
  ): Promise<void> | void;
  afterExecute?(
    tool: ToolDefinition<ToolInputSchema, ToolOutputSchema | undefined, TContext>,
    input: unknown,
    result: ToolSuccessPayload,
    context: TContext,
  ): Promise<void> | void;
  onError?(
    tool: ToolDefinition<ToolInputSchema, ToolOutputSchema | undefined, TContext>,
    input: unknown,
    error: AppError,
    context: TContext,
  ): Promise<void> | void;
}

export interface LifecycleHooks<TConfig extends BaseRuntimeConfig = BaseRuntimeConfig> {
  onStart?(config: TConfig): Promise<void> | void;
  onShutdown?(): Promise<void> | void;
}
