import type { AppError } from '../core/app-error.js';
import type { BaseToolExecutionContext } from '../core/execution-context.js';
import type { ToolDefinition, ToolSuccessPayload } from '../contracts/tool-contract.js';

export interface ExecutionHooks<
  TContext extends BaseToolExecutionContext = BaseToolExecutionContext,
> {
  beforeExecute?(
    tool: ToolDefinition<any, any, TContext>,
    input: unknown,
    context: TContext,
  ): Promise<void> | void;
  afterExecute?(
    tool: ToolDefinition<any, any, TContext>,
    input: unknown,
    result: ToolSuccessPayload,
    context: TContext,
  ): Promise<void> | void;
  onError?(
    tool: ToolDefinition<any, any, TContext>,
    input: unknown,
    error: AppError,
    context: TContext,
  ): Promise<void> | void;
}
