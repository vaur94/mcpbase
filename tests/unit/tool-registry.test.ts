import { describe, expect, it } from 'vitest';

import { createExampleTools } from '../../src/application/example-tools.js';
import { ToolRegistry } from '../../src/application/tool-registry.js';

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
});
