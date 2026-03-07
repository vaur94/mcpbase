import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { ApplicationRuntime } from '../../src/application/runtime.js';
import { isErrorResult } from '../../src/index.js';
import { createExampleTools } from '../../src/application/example-tools.js';
import { StderrLogger } from '../../src/logging/stderr-logger.js';
import type { BaseRuntimeConfig } from '../../src/contracts/runtime-config.js';
import type { BaseToolExecutionContext } from '../../src/core/execution-context.js';
import type { ToolDefinition } from '../../src/contracts/tool-contract.js';
import { createTextContent } from '../../src/core/result.js';
import { createFixtureConfig, createBaseFixtureConfig } from '../fixtures/runtime-config.js';

function createTestLogger() {
  return new StderrLogger({ level: 'error', includeTimestamp: false });
}

describe('ApplicationRuntime integration', () => {
  it('gecersiz giris icin normalize edilmis hata sonucu dondurur', async () => {
    const runtime = new ApplicationRuntime({
      config: createFixtureConfig(),
      logger: createTestLogger(),
      tools: createExampleTools(),
    });

    const result = await runtime.executeTool('text_transform', {
      text: '',
      mode: 'uppercase',
    });

    expect(result.isError).toBe(true);
    if (!isErrorResult(result)) {
      throw new Error('Hata sonucu bekleniyordu.');
    }
    expect(result.error).toMatchObject({ code: 'TOOL_EXECUTION_ERROR' });
  });

  it('guvenlik kontrolu olmadan arac calistirir', async () => {
    const runtime = new ApplicationRuntime({
      config: createFixtureConfig({
        security: {
          features: {
            serverInfoTool: true,
            textTransformTool: false,
          },
        },
      }),
      logger: createTestLogger(),
      tools: createExampleTools(),
    });

    const result = await runtime.executeTool('text_transform', {
      text: 'Hello',
      mode: 'trim',
    });

    expect(result.isError).toBe(false);
    expect(result.content[0]?.text).toBe('Hello');
  });

  it('ozel contextFactory ile tam akis calisir', async () => {
    interface CustomContext extends BaseToolExecutionContext {
      readonly traceId: string;
    }

    let capturedContext: CustomContext | undefined;

    const inputSchema = z.object({ msg: z.string().min(1) });
    const testTool: ToolDefinition<typeof inputSchema, undefined, CustomContext> = {
      name: 'integration_tool',
      title: 'Integration Tool',
      description: 'Integration test tool.',
      inputSchema,
      async execute(_input, context) {
        capturedContext = context;
        return { content: [createTextContent('done')] };
      },
    };

    const config = createBaseFixtureConfig();
    const runtime = new ApplicationRuntime<BaseRuntimeConfig, CustomContext>({
      config,
      logger: createTestLogger(),
      tools: [testTool],
      contextFactory: (toolName, requestId, cfg) => ({
        requestId,
        toolName,
        config: cfg,
        traceId: `trace-${requestId}`,
      }),
    });

    const result = await runtime.executeTool('integration_tool', { msg: 'test' });

    expect(result.isError).toBe(false);
    expect(result.content[0]?.text).toBe('done');
    expect(capturedContext?.traceId).toMatch(/^trace-/);
    expect(capturedContext?.toolName).toBe('integration_tool');
  });

  it('arac calistirma hatasini yakalayip error result dondurur', async () => {
    const inputSchema = z.object({});
    const failingTool: ToolDefinition = {
      name: 'failing_tool',
      title: 'Failing Tool',
      description: 'Always throws.',
      inputSchema,
      async execute() {
        throw new Error('Beklenmeyen hata');
      },
    };

    const runtime = new ApplicationRuntime({
      config: createBaseFixtureConfig(),
      logger: createTestLogger(),
      tools: [failingTool],
    });

    const result = await runtime.executeTool('failing_tool', {});

    expect(result.isError).toBe(true);
    if (!isErrorResult(result)) {
      throw new Error('Hata sonucu bekleniyordu.');
    }
    expect(result.error).toMatchObject({ code: 'TOOL_EXECUTION_ERROR' });
  });
});
