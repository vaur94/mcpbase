import { describe, expect, it } from 'vitest';

import { createExampleTools } from '../../src/application/example-tools.js';
import { ToolRegistry } from '../../src/application/tool-registry.js';

describe('ToolRegistry', () => {
  it('kayitli araci getirir ve listeler', () => {
    const registry = new ToolRegistry();
    const tools = createExampleTools();

    for (const tool of tools) {
      registry.register(tool);
    }

    expect(registry.get('server_info').name).toBe('server_info');
    expect(registry.list()).toHaveLength(2);
  });

  it('ayni isimli araci ikinci kez kabul etmez', () => {
    const registry = new ToolRegistry();
    const tool = createExampleTools()[0];

    if (!tool) {
      throw new Error('Ornek arac bulunamadi.');
    }

    registry.register(tool);

    expect(() => registry.register(tool)).toThrow(/ikinci arac kaydi/u);
  });

  it('olmayan araci istendiginde hata verir', () => {
    const registry = new ToolRegistry();

    expect(() => registry.get('olmayan')).toThrow(/Arac bulunamadi/u);
  });
});
