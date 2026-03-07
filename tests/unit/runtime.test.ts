import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { ApplicationRuntime } from '../../src/application/runtime.js';
import type { RuntimeOptions } from '../../src/application/runtime.js';
import { createExampleTools } from '../../src/application/example-tools.js';
import { StderrLogger } from '../../src/logging/stderr-logger.js';
import type { BaseRuntimeConfig } from '../../src/contracts/runtime-config.js';
import type { BaseToolExecutionContext } from '../../src/core/execution-context.js';
import type { ToolDefinition } from '../../src/contracts/tool-contract.js';
import { createTextContent } from '../../src/core/result.js';
import { createBaseFixtureConfig, createFixtureConfig } from '../fixtures/runtime-config.js';

function createTestLogger() {
  return new StderrLogger({ level: 'error', includeTimestamp: false });
}

describe('ApplicationRuntime options constructor', () => {
  it('options nesnesiyle olusturulabilir', () => {
    const config = createFixtureConfig();
    const runtime = new ApplicationRuntime({
      config,
      logger: createTestLogger(),
      tools: createExampleTools(),
    });

    expect(runtime.config).toBe(config);
    expect(runtime.registry).toBeDefined();
  });

  it('araclari registry ye kaydeder', () => {
    const tools = createExampleTools();
    const runtime = new ApplicationRuntime({
      config: createFixtureConfig(),
      logger: createTestLogger(),
      tools,
    });

    const listed = runtime.listTools();
    expect(listed).toHaveLength(tools.length);
    expect(listed.map((t) => t.name)).toEqual(tools.map((t) => t.name));
  });

  it('config alanini public olarak sunar', () => {
    const config = createFixtureConfig();
    const runtime = new ApplicationRuntime({
      config,
      logger: createTestLogger(),
      tools: [],
    });

    expect(runtime.config).toBe(config);
    expect(runtime.config.server.name).toBe('mcpbase');
  });
});

describe('ApplicationRuntime normalization', () => {
  it('basarili cikis icin normalize edilmis sonuc dondurur', async () => {
    const runtime = new ApplicationRuntime({
      config: createFixtureConfig(),
      logger: createTestLogger(),
      tools: createExampleTools(),
    });

    const result = await runtime.executeTool('text_transform', {
      text: 'Hello',
      mode: 'uppercase',
    });

    expect(result.isError).toBeUndefined();
    expect(result.content[0]?.type).toBe('text');
    expect(result.content[0]?.text).toBe('HELLO');
    expect(result.structuredContent).toEqual({
      transformedText: 'HELLO',
      mode: 'uppercase',
    });
  });

  it('bulunamayan arac icin hata dondurur', async () => {
    const runtime = new ApplicationRuntime({
      config: createFixtureConfig(),
      logger: createTestLogger(),
      tools: createExampleTools(),
    });

    const result = await runtime.executeTool('nonexistent_tool', {});

    expect(result.isError).toBe(true);
    expect(result.structuredContent).toMatchObject({ code: 'TOOL_NOT_FOUND' });
  });

  it('gecersiz giris icin dogrulama hatasi dondurur', async () => {
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
    expect(result.structuredContent).toMatchObject({ code: 'TOOL_EXECUTION_ERROR' });
  });
});

describe('ApplicationRuntime contextFactory', () => {
  it('varsayilan contextFactory requestId, toolName ve config icerir', async () => {
    let capturedContext: BaseToolExecutionContext | undefined;

    const inputSchema = z.object({ value: z.string() });
    const testTool: ToolDefinition<typeof inputSchema, undefined, BaseToolExecutionContext> = {
      name: 'context_capture',
      title: 'Context Capture',
      description: 'Captures the execution context for testing.',
      inputSchema,
      async execute(_input, context) {
        capturedContext = context;
        return { content: [createTextContent('ok')] };
      },
    };

    const config = createBaseFixtureConfig();
    const runtime = new ApplicationRuntime({
      config,
      logger: createTestLogger(),
      tools: [testTool],
    });

    await runtime.executeTool('context_capture', { value: 'test' });

    expect(capturedContext).toBeDefined();
    expect(capturedContext?.toolName).toBe('context_capture');
    expect(capturedContext?.requestId).toBeDefined();
    expect(capturedContext?.requestId.length).toBeGreaterThan(0);
    expect(capturedContext?.config).toBe(config);
  });

  it('ozel contextFactory kullanildiginda ozel context olusturur', async () => {
    interface CustomContext extends BaseToolExecutionContext {
      readonly customField: string;
    }

    let capturedContext: CustomContext | undefined;

    const inputSchema = z.object({ value: z.string() });
    const testTool: ToolDefinition<typeof inputSchema, undefined, CustomContext> = {
      name: 'custom_context_tool',
      title: 'Custom Context Tool',
      description: 'Tests custom context factory.',
      inputSchema,
      async execute(_input, context) {
        capturedContext = context;
        return { content: [createTextContent('ok')] };
      },
    };

    const config = createBaseFixtureConfig();
    const customFactory = (toolName: string, requestId: string, cfg: BaseRuntimeConfig) => ({
      requestId,
      toolName,
      config: cfg,
      customField: 'custom-value',
    });

    const runtime = new ApplicationRuntime<BaseRuntimeConfig, CustomContext>({
      config,
      logger: createTestLogger(),
      tools: [testTool],
      contextFactory: customFactory,
    });

    await runtime.executeTool('custom_context_tool', { value: 'test' });

    expect(capturedContext).toBeDefined();
    expect(capturedContext?.customField).toBe('custom-value');
    expect(capturedContext?.toolName).toBe('custom_context_tool');
    expect(capturedContext?.config).toBe(config);
  });

  it('contextFactory her executeTool cagrisinda yeni context olusturur', async () => {
    const factorySpy = vi.fn((toolName: string, requestId: string, config: BaseRuntimeConfig) => ({
      requestId,
      toolName,
      config,
    }));

    const inputSchema = z.object({});
    const testTool: ToolDefinition<typeof inputSchema> = {
      name: 'spy_tool',
      title: 'Spy Tool',
      description: 'Tests factory call count.',
      inputSchema,
      async execute() {
        return { content: [createTextContent('ok')] };
      },
    };

    const runtime = new ApplicationRuntime({
      config: createBaseFixtureConfig(),
      logger: createTestLogger(),
      tools: [testTool],
      contextFactory: factorySpy,
    });

    await runtime.executeTool('spy_tool', {});
    await runtime.executeTool('spy_tool', {});

    expect(factorySpy).toHaveBeenCalledTimes(2);
  });
});

describe('ApplicationRuntime guvenlik assertion icermez', () => {
  it('runtime assertFeatureEnabled cagirmaz', async () => {
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

    // text_transform araci textTransformTool: false olmasina ragmen calisir
    // cunku runtime artik guvenlik kontrolu yapmaz
    const result = await runtime.executeTool('text_transform', {
      text: 'Hello',
      mode: 'uppercase',
    });

    expect(result.isError).toBeUndefined();
    expect(result.content[0]?.text).toBe('HELLO');
  });
});

describe('ApplicationRuntime generic tipler', () => {
  it('BaseRuntimeConfig ile calisan runtime olusturulabilir', () => {
    const config = createBaseFixtureConfig();
    const runtime = new ApplicationRuntime({
      config,
      logger: createTestLogger(),
      tools: [],
    });

    expect(runtime.config.server.name).toBe('mcpbase');
    expect(runtime.config.logging.level).toBe('info');
  });

  it('RuntimeOptions arayuzu export edilir ve kullanilabilir', () => {
    const options: RuntimeOptions = {
      config: createBaseFixtureConfig(),
      logger: createTestLogger(),
      tools: [],
    };

    const runtime = new ApplicationRuntime(options);
    expect(runtime).toBeDefined();
  });
});
