import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { ApplicationRuntime } from '../../src/application/runtime.js';
import type { ExecutionHooks } from '../../src/contracts/hooks.js';
import type { ToolDefinition } from '../../src/contracts/tool-contract.js';
import type { BaseToolExecutionContext } from '../../src/core/execution-context.js';
import { AppError } from '../../src/core/app-error.js';
import { createTextContent } from '../../src/core/result.js';
import { StderrLogger } from '../../src/logging/stderr-logger.js';
import { createBaseFixtureConfig } from '../fixtures/runtime-config.js';

function createTestLogger() {
  return new StderrLogger({ level: 'error', includeTimestamp: false });
}

const inputSchema = z.object({ value: z.string() });

function createSuccessTool(
  name = 'test_tool',
): ToolDefinition<typeof inputSchema, undefined, BaseToolExecutionContext> {
  return {
    name,
    title: 'Test Tool',
    description: 'A tool for hook testing.',
    inputSchema,
    async execute() {
      return { content: [createTextContent('ok')] };
    },
  };
}

function createFailingTool(
  name = 'failing_tool',
): ToolDefinition<typeof inputSchema, undefined, BaseToolExecutionContext> {
  return {
    name,
    title: 'Failing Tool',
    description: 'A tool that always fails.',
    inputSchema,
    async execute() {
      throw new AppError('TOOL_EXECUTION_ERROR', 'Arac calisirken hata olustu.');
    },
  };
}

describe('ExecutionHooks beforeExecute', () => {
  it('beforeExecute hook basarili arac calistirilmadan once cagirilir', async () => {
    const callOrder: string[] = [];

    const tool = createSuccessTool();
    const originalExecute = tool.execute.bind(tool);
    const spiedTool: typeof tool = {
      ...tool,
      async execute(input, context) {
        callOrder.push('execute');
        return originalExecute(input, context);
      },
    };

    const hooks: ExecutionHooks = {
      beforeExecute: () => {
        callOrder.push('beforeExecute');
      },
    };

    const runtime = new ApplicationRuntime({
      config: createBaseFixtureConfig(),
      logger: createTestLogger(),
      tools: [spiedTool],
      hooks,
    });

    await runtime.executeTool('test_tool', { value: 'test' });

    expect(callOrder).toEqual(['beforeExecute', 'execute']);
  });

  it('beforeExecute firlatirsa arac calistirilmaz ve hata dondurulur', async () => {
    const executeSpy = vi.fn();

    const tool: ToolDefinition<typeof inputSchema, undefined, BaseToolExecutionContext> = {
      ...createSuccessTool(),
      execute: executeSpy,
    };

    const hooks: ExecutionHooks = {
      beforeExecute: () => {
        throw new AppError('PERMISSION_DENIED', 'Hook erisimi engelledi.');
      },
    };

    const runtime = new ApplicationRuntime({
      config: createBaseFixtureConfig(),
      logger: createTestLogger(),
      tools: [tool],
      hooks,
    });

    const result = await runtime.executeTool('test_tool', { value: 'test' });

    expect(result.isError).toBe(true);
    expect(executeSpy).not.toHaveBeenCalled();
  });

  it('beforeExecute hook a dogru tool, input ve context gecilir', async () => {
    const hookSpy = vi.fn();

    const hooks: ExecutionHooks = {
      beforeExecute: hookSpy,
    };

    const runtime = new ApplicationRuntime({
      config: createBaseFixtureConfig(),
      logger: createTestLogger(),
      tools: [createSuccessTool()],
      hooks,
    });

    await runtime.executeTool('test_tool', { value: 'hello' });

    expect(hookSpy).toHaveBeenCalledTimes(1);
    const [tool, input, context] = hookSpy.mock.calls[0] as [unknown, unknown, unknown];
    expect((tool as ToolDefinition).name).toBe('test_tool');
    expect(input).toEqual({ value: 'hello' });
    expect((context as BaseToolExecutionContext).toolName).toBe('test_tool');
    expect((context as BaseToolExecutionContext).requestId).toBeDefined();
  });
});

describe('ExecutionHooks afterExecute', () => {
  it('afterExecute hook basarili calistirmadan sonra cagirilir', async () => {
    const hookSpy = vi.fn();

    const hooks: ExecutionHooks = {
      afterExecute: hookSpy,
    };

    const runtime = new ApplicationRuntime({
      config: createBaseFixtureConfig(),
      logger: createTestLogger(),
      tools: [createSuccessTool()],
      hooks,
    });

    await runtime.executeTool('test_tool', { value: 'test' });

    expect(hookSpy).toHaveBeenCalledTimes(1);
    const [tool, input, result, context] = hookSpy.mock.calls[0] as [
      unknown,
      unknown,
      unknown,
      unknown,
    ];
    expect((tool as ToolDefinition).name).toBe('test_tool');
    expect(input).toEqual({ value: 'test' });
    expect(result).toEqual({ content: [createTextContent('ok')] });
    expect((context as BaseToolExecutionContext).toolName).toBe('test_tool');
  });

  it('afterExecute firlatirsa sonuc yine dondurulur ve hata loglanir', async () => {
    const logger = createTestLogger();
    const warnSpy = vi.spyOn(logger, 'warn');

    const hooks: ExecutionHooks = {
      afterExecute: () => {
        throw new Error('afterExecute patladı');
      },
    };

    const runtime = new ApplicationRuntime({
      config: createBaseFixtureConfig(),
      logger,
      tools: [createSuccessTool()],
      hooks,
    });

    const result = await runtime.executeTool('test_tool', { value: 'test' });

    expect(result.isError).toBeUndefined();
    expect(result.content[0]?.text).toBe('ok');
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('afterExecute hata durumunda cagirilmaz', async () => {
    const hookSpy = vi.fn();

    const hooks: ExecutionHooks = {
      afterExecute: hookSpy,
    };

    const runtime = new ApplicationRuntime({
      config: createBaseFixtureConfig(),
      logger: createTestLogger(),
      tools: [createFailingTool()],
      hooks,
    });

    await runtime.executeTool('failing_tool', { value: 'test' });

    expect(hookSpy).not.toHaveBeenCalled();
  });
});

describe('ExecutionHooks onError', () => {
  it('onError hook hata durumunda cagirilir', async () => {
    const hookSpy = vi.fn();

    const hooks: ExecutionHooks = {
      onError: hookSpy,
    };

    const runtime = new ApplicationRuntime({
      config: createBaseFixtureConfig(),
      logger: createTestLogger(),
      tools: [createFailingTool()],
      hooks,
    });

    await runtime.executeTool('failing_tool', { value: 'test' });

    expect(hookSpy).toHaveBeenCalledTimes(1);
    const [tool, input, error, context] = hookSpy.mock.calls[0] as [
      unknown,
      unknown,
      unknown,
      unknown,
    ];
    expect((tool as ToolDefinition).name).toBe('failing_tool');
    expect(input).toEqual({ value: 'test' });
    expect((error as AppError).code).toBe('TOOL_EXECUTION_ERROR');
    expect((context as BaseToolExecutionContext).toolName).toBe('failing_tool');
  });

  it('onError firlatirsa orijinal hata dondurulur ve hook hatasi loglanir', async () => {
    const logger = createTestLogger();
    const warnSpy = vi.spyOn(logger, 'warn');

    const hooks: ExecutionHooks = {
      onError: () => {
        throw new Error('onError patladı');
      },
    };

    const runtime = new ApplicationRuntime({
      config: createBaseFixtureConfig(),
      logger,
      tools: [createFailingTool()],
      hooks,
    });

    const result = await runtime.executeTool('failing_tool', { value: 'test' });

    expect(result.isError).toBe(true);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('onError basarili calistirmada cagirilmaz', async () => {
    const hookSpy = vi.fn();

    const hooks: ExecutionHooks = {
      onError: hookSpy,
    };

    const runtime = new ApplicationRuntime({
      config: createBaseFixtureConfig(),
      logger: createTestLogger(),
      tools: [createSuccessTool()],
      hooks,
    });

    await runtime.executeTool('test_tool', { value: 'test' });

    expect(hookSpy).not.toHaveBeenCalled();
  });
});

describe('ExecutionHooks coklu hook dizisi', () => {
  it('birden fazla hook sirayla calistirilir', async () => {
    const callOrder: string[] = [];

    const hooks: ExecutionHooks[] = [
      {
        beforeExecute: () => {
          callOrder.push('before-1');
        },
        afterExecute: () => {
          callOrder.push('after-1');
        },
      },
      {
        beforeExecute: () => {
          callOrder.push('before-2');
        },
        afterExecute: () => {
          callOrder.push('after-2');
        },
      },
    ];

    const runtime = new ApplicationRuntime({
      config: createBaseFixtureConfig(),
      logger: createTestLogger(),
      tools: [createSuccessTool()],
      hooks,
    });

    await runtime.executeTool('test_tool', { value: 'test' });

    expect(callOrder).toEqual(['before-1', 'before-2', 'after-1', 'after-2']);
  });

  it('dizideki ilk beforeExecute firlatirsa sonraki hooklar ve arac calistirilmaz', async () => {
    const secondHookSpy = vi.fn();
    const executeSpy = vi.fn();

    const tool: ToolDefinition<typeof inputSchema, undefined, BaseToolExecutionContext> = {
      ...createSuccessTool(),
      execute: executeSpy,
    };

    const hooks: ExecutionHooks[] = [
      {
        beforeExecute: () => {
          throw new AppError('PERMISSION_DENIED', 'Ilk hook engelledi.');
        },
      },
      {
        beforeExecute: secondHookSpy,
      },
    ];

    const runtime = new ApplicationRuntime({
      config: createBaseFixtureConfig(),
      logger: createTestLogger(),
      tools: [tool],
      hooks,
    });

    const result = await runtime.executeTool('test_tool', { value: 'test' });

    expect(result.isError).toBe(true);
    expect(secondHookSpy).not.toHaveBeenCalled();
    expect(executeSpy).not.toHaveBeenCalled();
  });

  it('onError dizisi hata durumunda sirayla calistirilir', async () => {
    const callOrder: string[] = [];

    const hooks: ExecutionHooks[] = [
      {
        onError: () => {
          callOrder.push('onError-1');
        },
      },
      {
        onError: () => {
          callOrder.push('onError-2');
        },
      },
    ];

    const runtime = new ApplicationRuntime({
      config: createBaseFixtureConfig(),
      logger: createTestLogger(),
      tools: [createFailingTool()],
      hooks,
    });

    await runtime.executeTool('failing_tool', { value: 'test' });

    expect(callOrder).toEqual(['onError-1', 'onError-2']);
  });
});

describe('ExecutionHooks hook olmadan calisma', () => {
  it('hook verilmezse normal calisir', async () => {
    const runtime = new ApplicationRuntime({
      config: createBaseFixtureConfig(),
      logger: createTestLogger(),
      tools: [createSuccessTool()],
    });

    const result = await runtime.executeTool('test_tool', { value: 'test' });

    expect(result.isError).toBeUndefined();
    expect(result.content[0]?.text).toBe('ok');
  });
});

describe('ExecutionHooks async hooklar', () => {
  it('async beforeExecute hook desteklenir', async () => {
    const hookSpy = vi.fn().mockResolvedValue(undefined);

    const hooks: ExecutionHooks = {
      beforeExecute: hookSpy,
    };

    const runtime = new ApplicationRuntime({
      config: createBaseFixtureConfig(),
      logger: createTestLogger(),
      tools: [createSuccessTool()],
      hooks,
    });

    await runtime.executeTool('test_tool', { value: 'test' });

    expect(hookSpy).toHaveBeenCalledTimes(1);
  });

  it('async afterExecute hook desteklenir', async () => {
    const hookSpy = vi.fn().mockResolvedValue(undefined);

    const hooks: ExecutionHooks = {
      afterExecute: hookSpy,
    };

    const runtime = new ApplicationRuntime({
      config: createBaseFixtureConfig(),
      logger: createTestLogger(),
      tools: [createSuccessTool()],
      hooks,
    });

    await runtime.executeTool('test_tool', { value: 'test' });

    expect(hookSpy).toHaveBeenCalledTimes(1);
  });
});
