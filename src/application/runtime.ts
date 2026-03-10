import { ensureAppError, type AppError, type BaseAppErrorCode } from '../core/app-error.js';
import type { BaseToolExecutionContext } from '../core/execution-context.js';
import type { ErrorResult, SuccessResult } from '../core/result.js';
import type { BaseRuntimeConfig } from '../contracts/runtime-config.js';
import type { ExecutionHooks } from '../contracts/hooks.js';
import type {
  ToolDefinition,
  ToolInputSchema,
  ToolOutputSchema,
  ToolSuccessPayload,
} from '../contracts/tool-contract.js';
import type { Logger } from '../logging/logger.js';
import type { TelemetryEvent, TelemetryRecorder } from '../telemetry/telemetry.js';
import type { ToolStateManager } from '../hub/tool-state.js';
import { createRequestId } from '../shared/request-id.js';
import { ToolRegistry } from './tool-registry.js';

export interface RuntimeOptions<
  TConfig extends BaseRuntimeConfig = BaseRuntimeConfig,
  TContext extends BaseToolExecutionContext<TConfig> = BaseToolExecutionContext<TConfig>,
> {
  readonly config: TConfig;
  readonly logger: Logger;
  readonly tools: ToolDefinition<ToolInputSchema, ToolOutputSchema | undefined, TContext>[];
  readonly contextFactory?: (toolName: string, requestId: string, config: TConfig) => TContext;
  readonly hooks?: ExecutionHooks<TContext> | ExecutionHooks<TContext>[];
  readonly telemetry?: TelemetryRecorder;
  readonly stateManager?: ToolStateManager;
}

function createSuccessResult(
  toolName: string,
  requestId: string,
  durationMs: number,
  payload: Awaited<ReturnType<ToolDefinition['execute']>>,
): SuccessResult {
  return {
    isError: false,
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
    isError: true,
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

function normalizeHooks<TContext extends BaseToolExecutionContext>(
  hooks?: ExecutionHooks<TContext> | ExecutionHooks<TContext>[],
): ExecutionHooks<TContext>[] {
  if (!hooks) return [];
  return Array.isArray(hooks) ? hooks : [hooks];
}

export class ApplicationRuntime<
  TConfig extends BaseRuntimeConfig = BaseRuntimeConfig,
  TContext extends BaseToolExecutionContext<TConfig> = BaseToolExecutionContext<TConfig>,
> {
  public readonly config: TConfig;
  public readonly registry: ToolRegistry<TContext>;
  private readonly logger: Logger;
  private readonly createContext: (toolName: string, requestId: string) => TContext;
  readonly #hooks: readonly ExecutionHooks<TContext>[];
  readonly #telemetry: TelemetryRecorder | undefined;

  public constructor(options: RuntimeOptions<TConfig, TContext>) {
    this.config = options.config;
    this.logger = options.logger;
    const factory = options.contextFactory ?? defaultContextFactory;
    this.createContext = (toolName, requestId) => factory(toolName, requestId, this.config);
    this.#hooks = normalizeHooks<TContext>(options.hooks);
    this.#telemetry = options.telemetry;
    this.registry = new ToolRegistry<TContext>({ stateManager: options.stateManager });
    for (const tool of options.tools) {
      this.registry.register(tool);
    }
  }

  public listTools(): ToolDefinition<ToolInputSchema, ToolOutputSchema | undefined, TContext>[] {
    return this.registry.list();
  }

  public async executeTool(
    name: string,
    rawInput: Record<string, unknown>,
  ): Promise<SuccessResult | ErrorResult> {
    const requestId = createRequestId();
    const startedAt = performance.now();

    let tool: ToolDefinition<ToolInputSchema, ToolOutputSchema | undefined, TContext> | undefined;
    let context: TContext | undefined;

    try {
      tool = this.registry.get(name);
      const input = tool.inputSchema.parse(rawInput);
      context = this.createContext(tool.name, requestId);

      await this.runBeforeHooks(tool, input, context);

      const payload = await tool.execute(input, context);
      if (tool.outputSchema && payload.structuredContent) {
        tool.outputSchema.parse(payload.structuredContent);
      }

      await this.runAfterHooks(tool, input, payload, context);

      const durationMs = Math.round(performance.now() - startedAt);
      this.recordTelemetry({ toolName: tool.name, durationMs, success: true });
      const result = createSuccessResult(tool.name, requestId, durationMs, payload);
      this.logger.info('Tool execution completed successfully.', {
        requestId,
        toolName: tool.name,
        durationMs,
      });

      return result;
    } catch (error) {
      const appError = ensureAppError<BaseAppErrorCode>(error);
      const durationMs = Math.round(performance.now() - startedAt);
      this.recordTelemetry({ toolName: name, durationMs, success: false });

      if (tool) {
        const errorContext = context ?? this.createContext(name, requestId);
        await this.runOnErrorHooks(tool, rawInput, appError, errorContext);
      }

      const result = createErrorResult(name, requestId, durationMs, appError);
      this.logger.error('Tool execution failed.', {
        requestId,
        toolName: name,
        durationMs,
        errorCode: result.error.code,
      });

      return result;
    }
  }

  private recordTelemetry(event: TelemetryEvent): void {
    if (!this.#telemetry) return;
    try {
      this.#telemetry.record(event);
    } catch (telemetryError) {
      this.logger.warn('Telemetry recording failed.', {
        toolName: event.toolName,
        errorCode:
          telemetryError instanceof Error ? telemetryError.message : 'Unknown telemetry error',
      });
    }
  }

  private async runBeforeHooks(
    tool: ToolDefinition<ToolInputSchema, ToolOutputSchema | undefined, TContext>,
    input: unknown,
    context: TContext,
  ): Promise<void> {
    for (const hook of this.#hooks) {
      if (hook.beforeExecute) {
        await hook.beforeExecute(tool, input, context);
      }
    }
  }

  private async runAfterHooks(
    tool: ToolDefinition<ToolInputSchema, ToolOutputSchema | undefined, TContext>,
    input: unknown,
    result: ToolSuccessPayload,
    context: TContext,
  ): Promise<void> {
    for (const hook of this.#hooks) {
      if (hook.afterExecute) {
        try {
          await hook.afterExecute(tool, input, result, context);
        } catch (hookError) {
          this.logger.warn('afterExecute hook failed.', {
            toolName: tool.name,
            errorCode:
              hookError instanceof Error ? hookError.message : 'Unknown afterExecute hook error',
          });
        }
      }
    }
  }

  private async runOnErrorHooks(
    tool: ToolDefinition<ToolInputSchema, ToolOutputSchema | undefined, TContext>,
    input: unknown,
    error: AppError<BaseAppErrorCode>,
    context: TContext,
  ): Promise<void> {
    for (const hook of this.#hooks) {
      if (hook.onError) {
        try {
          await hook.onError(tool, input, error, context);
        } catch (hookError) {
          this.logger.warn('onError hook failed.', {
            toolName: tool.name,
            errorCode:
              hookError instanceof Error ? hookError.message : 'Unknown onError hook error',
          });
        }
      }
    }
  }
}
