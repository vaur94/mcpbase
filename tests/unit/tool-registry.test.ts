import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { createExampleTools } from '../../src/application/example-tools.js';
import { ToolRegistry } from '../../src/application/tool-registry.js';
import { createTextContent } from '../../src/core/result.js';
import type { BaseToolExecutionContext } from '../../src/core/execution-context.js';
import type { RuntimeConfig } from '../../src/contracts/runtime-config.js';
import type { ToolDefinition } from '../../src/contracts/tool-contract.js';

const customInputSchema = z.object({ value: z.string() });

describe('ToolRegistry', () => {
  it('retrieves and lists registered tools', () => {
    const registry = new ToolRegistry();
    const tools = createExampleTools();

    for (const tool of tools) {
      registry.register(tool);
    }

    expect(registry.get('server_info').name).toBe('server_info');
    expect(registry.list()).toHaveLength(2);
  });

  it('rejects a second registration with the same name', () => {
    const registry = new ToolRegistry();
    const tool = createExampleTools()[0];

    if (!tool) {
      throw new Error('Example tool was not found.');
    }

    registry.register(tool);

    expect(() => registry.register(tool)).toThrow(/Duplicate tool registration/u);
  });

  it('throws when a requested tool does not exist', () => {
    const registry = new ToolRegistry();

    expect(() => registry.get('missing')).toThrow(/Tool not found/u);
  });

  it('has() ile kayitli aracin varligini kontrol eder', () => {
    const registry = new ToolRegistry();
    const tool = createExampleTools()[0];

    expect(tool).toBeDefined();
    if (!tool) {
      throw new Error('Ornek arac bulunamadi.');
    }

    registry.register(tool);

    expect(registry.has(tool.name)).toBe(true);
    expect(registry.has('missing')).toBe(false);
  });

  it('tryGet() kayitli araci doner, bulunmuyorsa undefined dondurur', () => {
    const registry = new ToolRegistry();
    const tool = createExampleTools()[0];

    expect(tool).toBeDefined();
    if (!tool) {
      throw new Error('Ornek arac bulunamadi.');
    }

    registry.register(tool);

    expect(registry.tryGet(tool.name)?.name).toBe(tool.name);
    expect(registry.tryGet('missing')).toBeUndefined();
  });

  // Generic tests for TContext
  it('ToolRegistry<TContext> doğru tipli tool kaydeder', () => {
    interface CustomContext extends BaseToolExecutionContext<RuntimeConfig> {
      readonly customField: string;
    }

    const registry = new ToolRegistry<CustomContext>();
    const customTool: ToolDefinition<typeof customInputSchema, undefined, CustomContext> = {
      name: 'custom_tool',
      title: 'Custom Tool',
      description: 'Ozel context kullanan arac',
      inputSchema: customInputSchema,
      async execute(input, context) {
        return {
          content: [createTextContent(`${context.customField}:${input.value}`)],
        };
      },
    };

    registry.register(customTool);

    expect(registry.get('custom_tool').name).toBe('custom_tool');
    expect(registry.list()).toHaveLength(1);
  });

  it('get() doğru TContext ile döner', async () => {
    interface CustomContext extends BaseToolExecutionContext<RuntimeConfig> {
      readonly customField: string;
    }

    const registry = new ToolRegistry<CustomContext>();
    const customTool: ToolDefinition<typeof customInputSchema, undefined, CustomContext> = {
      name: 'custom_tool',
      title: 'Custom Tool',
      description: 'Ozel context kullanan arac',
      inputSchema: customInputSchema,
      async execute(input, context) {
        return {
          content: [createTextContent(`${context.customField}:${input.value}`)],
        };
      },
    };

    registry.register(customTool);

    const tool = registry.get('custom_tool');
    const result = await tool.execute(
      { value: 'merhaba' },
      {
        requestId: 'req-1',
        toolName: 'custom_tool',
        customField: 'tenant-a',
        config: {
          server: { name: 'mcpbase', version: '0.1.0' },
          logging: { level: 'info', includeTimestamp: true },
          security: {
            features: { serverInfoTool: true, textTransformTool: true },
            commands: { allowed: [] },
            paths: { allowed: [] },
          },
        },
      },
    );

    expect(tool.name).toBe('custom_tool');
    expect(result.content[0]?.text).toBe('tenant-a:merhaba');
  });

  it('varsayılan TContext ile çalışır (geriye uyumluluk)', () => {
    const registry = new ToolRegistry();
    const tools = createExampleTools();

    for (const tool of tools) {
      registry.register(tool);
    }

    const tool = registry.get('text_transform');
    expect(tool.name).toBe('text_transform');
    expect(tool.execute).toBeDefined();
  });
});
