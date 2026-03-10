import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { ToolRegistry } from '../../src/application/tool-registry.js';
import { createTextContent } from '../../src/core/result.js';
import { createToolStateManager } from '../../src/hub/tool-state.js';

function createTestTool(name: string) {
  return {
    name,
    title: `${name} baslik`,
    description: `${name} aciklama`,
    inputSchema: z.object({}),
    async execute() {
      return {
        content: [createTextContent('ok')],
      };
    },
  };
}

describe('arac durum yoneticisi', () => {
  it('varsayilan durumda tanimli ve bilinmeyen araclar enabled kabul edilir', () => {
    const manager = createToolStateManager(['arac_a']);

    expect(manager.getState('arac_a')).toBe('enabled');
    expect(manager.getState('bilinmeyen')).toBe('enabled');
    expect(manager.isCallable('bilinmeyen')).toBe(true);
    expect(manager.isVisible('bilinmeyen')).toBe(true);
  });

  it('durum degisikligini reason ile saklar ve dinleyiciyi tetikler', () => {
    const manager = createToolStateManager(['arac_a']);
    const olaylar: string[] = [];

    manager.onChange((toolName, state) => {
      olaylar.push(`${toolName}:${state}`);
    });

    manager.setState('arac_a', 'disabled', 'bakim');

    expect(manager.listStates()).toContainEqual({
      name: 'arac_a',
      state: 'disabled',
      reason: 'bakim',
    });
    expect(olaylar).toEqual(['arac_a:disabled']);
  });
});

describe('kayit defteri ile durum yonetimi', () => {
  it('state manager yoksa tum araclari listeler ve getirir', () => {
    const registry = new ToolRegistry();
    registry.register(createTestTool('arac_a'));
    registry.register(createTestTool('arac_b'));

    expect(registry.list().map((tool) => tool.name)).toEqual(['arac_a', 'arac_b']);
    expect(registry.get('arac_b').name).toBe('arac_b');
  });

  it('state manager varken hidden ve disabled araclari listeden gizler', () => {
    const manager = createToolStateManager(['arac_a', 'arac_b', 'arac_c']);
    manager.setState('arac_b', 'disabled');
    manager.setState('arac_c', 'hidden');

    const registry = new ToolRegistry({ stateManager: manager });
    registry.register(createTestTool('arac_a'));
    registry.register(createTestTool('arac_b'));
    registry.register(createTestTool('arac_c'));

    expect(registry.list().map((tool) => tool.name)).toEqual(['arac_a']);
  });

  it('disabled arac getirilmek istendiginde TOOL_EXECUTION_ERROR dondurur', () => {
    const manager = createToolStateManager(['arac_a']);
    manager.setState('arac_a', 'disabled');

    const registry = new ToolRegistry({ stateManager: manager });
    registry.register(createTestTool('arac_a'));

    expect(() => registry.get('arac_a')).toThrow(/currently disabled/u);

    try {
      registry.get('arac_a');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toMatchObject({ code: 'TOOL_EXECUTION_ERROR' });
    }
  });

  it('hidden arac getirilmek istendiginde TOOL_NOT_FOUND dondurur', () => {
    const manager = createToolStateManager(['arac_a']);
    manager.setState('arac_a', 'hidden');

    const registry = new ToolRegistry({ stateManager: manager });
    registry.register(createTestTool('arac_a'));

    expect(() => registry.get('arac_a')).toThrow(/not found/u);

    try {
      registry.get('arac_a');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toMatchObject({ code: 'TOOL_NOT_FOUND' });
    }
  });
});
