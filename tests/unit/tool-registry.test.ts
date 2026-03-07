import { describe, expect, it } from 'vitest';

import { createExampleTools } from '../../src/application/example-tools.js';
import { ToolRegistry } from '../../src/application/tool-registry.js';
import type { BaseToolExecutionContext } from '../../src/core/execution-context.js';
import type { RuntimeConfig } from '../../src/contracts/runtime-config.js';

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

  // Generic tests for TContext
  it('ToolRegistry<TContext> doğru tipli tool kaydeder', () => {
    interface CustomContext extends BaseToolExecutionContext {
      readonly customField: string;
    }

    const registry = new ToolRegistry<CustomContext>();

    const tools = createExampleTools();
    for (const tool of tools) {
      registry.register(tool);
    }

    expect(registry.get('server_info').name).toBe('server_info');
    expect(registry.list()).toHaveLength(2);
  });

  it('get() doğru TContext ile döner', () => {
    interface CustomContext extends BaseToolExecutionContext {
      readonly customField: string;
    }

    const registry = new ToolRegistry<CustomContext>();

    const tools = createExampleTools();
    for (const tool of tools) {
      registry.register(tool);
    }

    const tool = registry.get('server_info');
    expect(tool.name).toBe('server_info');
    expect(tool.execute).toBeDefined();
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
