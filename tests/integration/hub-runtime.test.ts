import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { ApplicationRuntime } from '../../src/application/runtime.js';
import { createTextContent, isErrorResult } from '../../src/core/result.js';
import { createIntrospectionTool } from '../../src/hub/introspection.js';
import { createToolStateManager } from '../../src/hub/tool-state.js';
import { StderrLogger } from '../../src/logging/stderr-logger.js';
import { createInMemoryTelemetry } from '../../src/telemetry/telemetry.js';
import { createManagedMcpServer } from '../../src/transport/mcp/server.js';
import { createBaseFixtureConfig } from '../fixtures/runtime-config.js';

function createTestLogger() {
  return new StderrLogger({ level: 'error', includeTimestamp: false });
}

function createSayTool(name: string, text: string) {
  return {
    name,
    title: `${name} baslik`,
    description: `${name} aciklama`,
    inputSchema: z.object({}),
    async execute() {
      return {
        content: [createTextContent(text)],
      };
    },
  };
}

describe('hub runtime entegrasyonu', () => {
  it('durum yoneticisi varken disabled arac calismaz ama enabled arac calisir', async () => {
    const stateManager = createToolStateManager(['aktif_arac', 'pasif_arac']);
    stateManager.setState('pasif_arac', 'disabled', 'bakim');

    const aktifArac = createSayTool('aktif_arac', 'aktif');
    let pasifCalismaSayisi = 0;
    const pasifArac = {
      ...createSayTool('pasif_arac', 'pasif'),
      async execute() {
        pasifCalismaSayisi += 1;
        return {
          content: [createTextContent('pasif')],
        };
      },
    };

    const runtime = new ApplicationRuntime({
      config: createBaseFixtureConfig(),
      logger: createTestLogger(),
      tools: [aktifArac, pasifArac],
      stateManager,
    });

    const pasifSonuc = await runtime.executeTool('pasif_arac', {});
    expect(pasifSonuc.isError).toBe(true);
    if (!isErrorResult(pasifSonuc)) {
      throw new Error('Hata sonucu bekleniyordu.');
    }
    expect(pasifSonuc.error).toMatchObject({ code: 'TOOL_EXECUTION_ERROR' });
    expect(pasifCalismaSayisi).toBe(0);

    const aktifSonuc = await runtime.executeTool('aktif_arac', {});
    expect(aktifSonuc.isError).toBe(false);
    expect(aktifSonuc.content[0]?.text).toBe('aktif');
  });

  it('durum yoneticisi yoksa onceki davranis korunur ve arac calisir', async () => {
    const runtime = new ApplicationRuntime({
      config: createBaseFixtureConfig(),
      logger: createTestLogger(),
      tools: [createSayTool('arac_a', 'tamam')],
    });

    const sonuc = await runtime.executeTool('arac_a', {});

    expect(sonuc.isError).toBe(false);
    expect(sonuc.content[0]?.text).toBe('tamam');
  });

  it('introspection araci durumlari ve telemetry snapshot bilgisini yapili olarak dondurur', async () => {
    const telemetry = createInMemoryTelemetry();
    const stateManager = createToolStateManager(['acik_arac', 'kapali_arac']);
    stateManager.setState('kapali_arac', 'disabled', 'bakim');

    const runtime = new ApplicationRuntime({
      config: createBaseFixtureConfig({
        server: {
          name: 'hub-test-server',
          version: '1.2.3',
        },
      }),
      logger: createTestLogger(),
      tools: [createSayTool('acik_arac', 'acik'), createSayTool('kapali_arac', 'kapali')],
      telemetry,
      stateManager,
    });

    const introspectionAraci = createIntrospectionTool(
      { includeTelemetry: true },
      {
        config: runtime.config,
        registry: runtime.registry,
        telemetry,
        stateManager,
        mcpbaseVersion: '2.0.0',
      },
    );
    runtime.registry.register(introspectionAraci);

    await runtime.executeTool('acik_arac', {});
    await runtime.executeTool('kapali_arac', {});

    const sonuc = await runtime.executeTool('_mcpbase_introspect', {});
    if (isErrorResult(sonuc)) {
      throw new Error('Basarili introspection sonucu bekleniyordu.');
    }

    expect(sonuc.structuredContent).toMatchObject({
      server: { name: 'hub-test-server', version: '1.2.3' },
      mcpbase: { version: '2.0.0' },
      telemetry: {
        available: true,
        snapshot: {
          totalCalls: expect.any(Number),
          totalErrors: expect.any(Number),
          capturedAt: expect.any(String),
        },
      },
      tools: [
        { name: '_mcpbase_introspect', state: 'enabled' },
        { name: 'acik_arac', state: 'enabled' },
        { name: 'kapali_arac', state: 'disabled' },
      ],
      toolStates: [
        { name: 'acik_arac', state: 'enabled' },
        { name: 'kapali_arac', state: 'disabled', reason: 'bakim' },
      ],
    });

    const structured = sonuc.structuredContent as {
      telemetry: {
        snapshot?: { tools: Record<string, { callCount: number; errorCount: number }> };
      };
    };

    expect(structured.telemetry.snapshot?.tools['acik_arac']?.callCount).toBe(1);
    expect(structured.telemetry.snapshot?.tools['kapali_arac']?.errorCount).toBe(1);
  });

  it('managed mcp server arac handlelarini sunar ve durum degisimini eszamanlar', () => {
    const stateManager = createToolStateManager(['arac_a', 'arac_b']);
    stateManager.setState('arac_b', 'disabled');

    const runtime = new ApplicationRuntime({
      config: createBaseFixtureConfig(),
      logger: createTestLogger(),
      tools: [createSayTool('arac_a', 'a'), createSayTool('arac_b', 'b')],
      stateManager,
    });

    const managed = createManagedMcpServer(runtime);

    expect(managed.toolHandles.size).toBe(2);
    expect(managed.toolHandles.has('arac_a')).toBe(true);
    expect(managed.toolHandles.has('arac_b')).toBe(true);
    expect(managed.toolHandles.get('arac_a')?.enabled).toBe(true);
    expect(managed.toolHandles.get('arac_b')?.enabled).toBe(false);

    stateManager.setState('arac_a', 'disabled');
    expect(managed.toolHandles.get('arac_a')?.enabled).toBe(false);

    stateManager.setState('arac_a', 'enabled');
    expect(managed.toolHandles.get('arac_a')?.enabled).toBe(true);

    stateManager.setState('arac_b', 'hidden');
    expect(managed.toolHandles.has('arac_b')).toBe(false);

    stateManager.setState('arac_b', 'disabled');
    expect(managed.toolHandles.get('arac_b')?.enabled).toBe(false);
  });
});
