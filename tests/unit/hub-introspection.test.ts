import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { ToolRegistry } from '../../src/application/tool-registry.js';
import { createTextContent } from '../../src/core/result.js';
import { createIntrospectionTool } from '../../src/hub/introspection.js';
import { createToolStateManager } from '../../src/hub/tool-state.js';
import { createInMemoryTelemetry } from '../../src/telemetry/telemetry.js';

function createTestTool(name: string, title = `${name} baslik`) {
  return {
    name,
    title,
    description: `${name} aciklama`,
    inputSchema: z.object({}),
    annotations: {
      readOnlyHint: true,
    },
    async execute() {
      return {
        content: [createTextContent('ok')],
      };
    },
  };
}

describe('merkez icgoru araci', () => {
  it('bos arac listesinde telemetry ve state manager yoksa yalin sonuc dondurur', async () => {
    const registry = new ToolRegistry();
    const introspectionTool = createIntrospectionTool(
      {},
      {
        config: {
          server: { name: 'test-server', version: '1.0.0' },
          logging: { level: 'info', includeTimestamp: true },
        },
        registry,
        mcpbaseVersion: '2.0.0',
      },
    );

    const result = await introspectionTool.execute(
      {},
      {
        requestId: 'req-1',
        toolName: introspectionTool.name,
        config: {
          server: { name: 'test-server', version: '1.0.0' },
          logging: { level: 'info', includeTimestamp: true },
        },
      },
    );

    expect(result.structuredContent).toMatchObject({
      server: { name: 'test-server', version: '1.0.0' },
      telemetry: { available: false },
      tools: [],
    });
    expect(result.structuredContent?.toolStates).toBeUndefined();
  });

  it('disabled ve hidden araclari gorunur liste disinda olsa da introspection sonucuna ekler', async () => {
    const manager = createToolStateManager(['arac_acik', 'arac_kapali', 'arac_gizli']);
    manager.setState('arac_kapali', 'disabled');
    manager.setState('arac_gizli', 'hidden');

    const registry = new ToolRegistry({ stateManager: manager });
    registry.register(createTestTool('arac_acik'));
    registry.register(createTestTool('arac_kapali'));
    registry.register(createTestTool('arac_gizli'));

    const introspectionTool = createIntrospectionTool(
      { includeTelemetry: false },
      {
        config: {
          server: { name: 'test-server', version: '1.0.0' },
          logging: { level: 'info', includeTimestamp: true },
        },
        registry,
        stateManager: manager,
        mcpbaseVersion: '2.0.0',
      },
    );

    const result = await introspectionTool.execute(
      {},
      {
        requestId: 'req-2',
        toolName: introspectionTool.name,
        config: {
          server: { name: 'test-server', version: '1.0.0' },
          logging: { level: 'info', includeTimestamp: true },
        },
      },
    );

    expect(result.structuredContent).toMatchObject({
      tools: [
        { name: 'arac_acik', state: 'enabled' },
        { name: 'arac_gizli', state: 'hidden' },
        { name: 'arac_kapali', state: 'disabled' },
      ],
      telemetry: { available: false },
    });
    expect(result.structuredContent?.toolStates).toHaveLength(3);
  });

  it('telemetry kaydedici varken includeTelemetry kapaliysa snapshot eklemez', async () => {
    const telemetry = createInMemoryTelemetry();
    telemetry.record({ toolName: 'ornek', durationMs: 12, success: true });

    const registry = new ToolRegistry();
    registry.register(createTestTool('ornek'));

    const introspectionTool = createIntrospectionTool(
      { includeTelemetry: false, toolName: 'ozel_introspect' },
      {
        config: {
          server: { name: 'test-server', version: '1.0.0' },
          logging: { level: 'info', includeTimestamp: true },
        },
        registry,
        telemetry,
        mcpbaseVersion: '2.0.0',
      },
    );

    const result = await introspectionTool.execute(
      {},
      {
        requestId: 'req-3',
        toolName: introspectionTool.name,
        config: {
          server: { name: 'test-server', version: '1.0.0' },
          logging: { level: 'info', includeTimestamp: true },
        },
      },
    );

    expect(introspectionTool.name).toBe('ozel_introspect');
    expect(result.structuredContent).toMatchObject({
      telemetry: {
        available: true,
      },
    });
    expect(result.structuredContent?.telemetry).not.toHaveProperty('snapshot');
  });

  it('opsiyonel transport ve capability baglamini sonuca yansitir', async () => {
    const registry = new ToolRegistry();
    registry.register(createTestTool('ornek'));

    const introspectionTool = createIntrospectionTool(
      {},
      {
        config: {
          server: { name: 'test-server', version: '1.0.0' },
          logging: { level: 'info', includeTimestamp: true },
        },
        registry,
        mcpbaseVersion: '2.0.0',
        transports: ['stdio', 'streamable-http'],
        capabilities: {
          tools: true,
          resources: true,
          prompts: true,
          logging: true,
          sampling: false,
          roots: true,
        },
      },
    );

    const result = await introspectionTool.execute(
      {},
      {
        requestId: 'req-4',
        toolName: introspectionTool.name,
        config: {
          server: { name: 'test-server', version: '1.0.0' },
          logging: { level: 'info', includeTimestamp: true },
        },
      },
    );

    expect(result.structuredContent).toMatchObject({
      transports: ['stdio', 'streamable-http'],
      capabilities: {
        tools: true,
        resources: true,
        prompts: true,
        logging: true,
        sampling: false,
        roots: true,
      },
    });
  });
});
