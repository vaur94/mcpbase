import { ensureAppError } from '../core/app-error.js';
import type { ToolExecutionContext } from '../core/execution-context.js';
import type { ErrorResult, SuccessResult } from '../core/result.js';
import type { RuntimeConfig } from '../contracts/runtime-config.js';
import type { ToolDefinition } from '../contracts/tool-contract.js';
import type { Logger } from '../logging/logger.js';
import { createRequestId } from '../shared/request-id.js';
import { assertFeatureEnabled } from '../security/guards.js';
import { ToolRegistry } from './tool-registry.js';

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
  error: ReturnType<typeof ensureAppError>,
): ErrorResult {
  return {
    content: [
      {
        type: 'text',
        text: error.expose ? error.message : 'Arac calisirken beklenmeyen bir hata olustu.',
      },
    ],
    error: {
      code: error.code,
      message: error.expose ? error.message : 'Beklenmeyen hata',
    },
    metadata: {
      requestId,
      toolName,
      durationMs,
    },
  };
}

export class ApplicationRuntime {
  public readonly registry: ToolRegistry;

  public constructor(
    public readonly config: RuntimeConfig,
    private readonly logger: Logger,
    tools: ToolDefinition[],
  ) {
    this.registry = new ToolRegistry();
    for (const tool of tools) {
      this.registry.register(tool);
    }
  }

  public listTools(): ToolDefinition[] {
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
    const tool = this.registry.get(name);
    const context: ToolExecutionContext = {
      requestId,
      toolName: tool.name,
      config: this.config,
    };

    try {
      if (tool.security?.requiredFeature) {
        assertFeatureEnabled(this.config.security, tool.security.requiredFeature);
      }

      const input = tool.inputSchema.parse(rawInput);
      const payload = await tool.execute(input, context);
      if (tool.outputSchema && payload.structuredContent) {
        tool.outputSchema.parse(payload.structuredContent);
      }

      const durationMs = Math.round(performance.now() - startedAt);
      const result = createSuccessResult(tool.name, requestId, durationMs, payload);
      this.logger.info('Arac basariyla tamamlandi.', {
        requestId,
        toolName: tool.name,
        durationMs,
      });

      return {
        content: result.content,
        structuredContent: result.structuredContent,
      };
    } catch (error) {
      const appError = ensureAppError(error);
      const durationMs = Math.round(performance.now() - startedAt);
      const result = createErrorResult(tool.name, requestId, durationMs, appError);
      this.logger.error('Arac cagrisi hata ile sonlandi.', {
        requestId,
        toolName: tool.name,
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
