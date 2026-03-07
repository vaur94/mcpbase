import { ensureAppError, type AppError, type BaseAppErrorCode } from '../core/app-error.js';
import type { BaseToolExecutionContext } from '../core/execution-context.js';
import type { ErrorResult, SuccessResult } from '../core/result.js';
import type { BaseRuntimeConfig } from '../contracts/runtime-config.js';
import type { ToolDefinition } from '../contracts/tool-contract.js';
import type { Logger } from '../logging/logger.js';
import { createRequestId } from '../shared/request-id.js';
import { ToolRegistry } from './tool-registry.js';

export interface RuntimeOptions<
  TConfig extends BaseRuntimeConfig = BaseRuntimeConfig,
  TContext extends BaseToolExecutionContext<TConfig> = BaseToolExecutionContext<TConfig>,
> {
  readonly config: TConfig;
  readonly logger: Logger;
  readonly tools: ToolDefinition<any, any, TContext>[];
  readonly contextFactory?: (toolName: string, requestId: string, config: TConfig) => TContext;
}

function createSuccessResult(
  toolName: string,
  requestId: string,
  durationMs: number,
  payload: Awaited<ReturnType<ToolDefinition['execute']>>,
): SuccessResult {
  return {
    content: payload.content,
    structuredContent: payload.structuredContent,
    metadata: {
      requestId,
      toolName,
      durationMs,
    },
  };
}

function createErrorResult(
  toolName: string,
  requestId: string,
  durationMs: number,
  error: AppError<BaseAppErrorCode>,
): ErrorResult {
  return {
    content: [
      {
        type: 'text',
        text: error.expose ? error.message : 'An unexpected error occurred while running the tool.',
      },
    ],
    error: {
      code: error.code,
      message: error.expose ? error.message : 'Unexpected error',
    },
    metadata: {
      requestId,
      toolName,
      durationMs,
    },
  };
}

function defaultContextFactory<
  TConfig extends BaseRuntimeConfig,
  TContext extends BaseToolExecutionContext<TConfig>,
>(toolName: string, requestId: string, config: TConfig): TContext {
  return { requestId, toolName, config } as TContext;
}

export class ApplicationRuntime<
  TConfig extends BaseRuntimeConfig = BaseRuntimeConfig,
  TContext extends BaseToolExecutionContext<TConfig> = BaseToolExecutionContext<TConfig>,
> {
  public readonly config: TConfig;
  public readonly registry: ToolRegistry<TContext>;
  private readonly logger: Logger;
  private readonly createContext: (toolName: string, requestId: string) => TContext;

  public constructor(options: RuntimeOptions<TConfig, TContext>) {
    this.config = options.config;
    this.logger = options.logger;
    const factory = options.contextFactory ?? defaultContextFactory;
    this.createContext = (toolName, requestId) => factory(toolName, requestId, this.config);
    this.registry = new ToolRegistry<TContext>();
    for (const tool of options.tools) {
      this.registry.register(tool);
    }
  }

  public listTools(): ToolDefinition<any, any, TContext>[] {
    return this.registry.list();
  }

  public async executeTool(
    name: string,
    rawInput: Record<string, unknown>,
  ): Promise<{
    content: { type: 'text'; text: string }[];
    structuredContent?: Record<string, unknown>;
    isError?: boolean;
  }> {
    const requestId = createRequestId();
    const startedAt = performance.now();

    try {
      const tool = this.registry.get(name);
      const input = tool.inputSchema.parse(rawInput);
      const context = this.createContext(tool.name, requestId);
      const payload = await tool.execute(input, context);
      if (tool.outputSchema && payload.structuredContent) {
        tool.outputSchema.parse(payload.structuredContent);
      }

      const durationMs = Math.round(performance.now() - startedAt);
      const result = createSuccessResult(tool.name, requestId, durationMs, payload);
      this.logger.info('Tool execution completed successfully.', {
        requestId,
        toolName: tool.name,
        durationMs,
      });

      return {
        content: result.content,
        structuredContent: result.structuredContent,
      };
    } catch (error) {
      const appError = ensureAppError<BaseAppErrorCode>(error);
      const durationMs = Math.round(performance.now() - startedAt);
      const result = createErrorResult(name, requestId, durationMs, appError);
      this.logger.error('Tool execution failed.', {
        requestId,
        toolName: name,
        durationMs,
        errorCode: result.error.code,
      });

      return {
        content: result.content,
        isError: true,
        structuredContent: {
          code: result.error.code,
          message: result.error.message,
        },
      };
    }
  }
}
