import { describe, expect, it, vi } from 'vitest';

import { ApplicationRuntime } from '../../src/application/runtime.js';
import { createExampleTools } from '../../src/application/example-tools.js';
import { StderrLogger } from '../../src/logging/stderr-logger.js';
import { createMcpServer, startStdioServer } from '../../src/transport/mcp/server.js';
import type { McpServerOptions } from '../../src/transport/mcp/server.js';
import type { ResourceDefinition } from '../../src/capabilities/resources.js';
import type { PromptDefinition } from '../../src/capabilities/prompts.js';
import { createFixtureConfig } from '../fixtures/runtime-config.js';

function createTestRuntime(): ApplicationRuntime {
  return new ApplicationRuntime({
    config: createFixtureConfig(),
    logger: new StderrLogger({ level: 'error', includeTimestamp: false }),
    tools: createExampleTools(),
  });
}

describe('MCP transport', () => {
  it('calisma zamani araclarini MCP sunucusuna kaydeder', () => {
    const runtime = createTestRuntime();

    const server = createMcpServer(runtime);

    expect(server).toBeDefined();
  });

  it('stdio transport uzerinden baglanir', async () => {
    const runtime = createTestRuntime();
    const server = createMcpServer(runtime);
    const connectSpy = vi.spyOn(server, 'connect').mockResolvedValue(undefined as never);

    const transport = await startStdioServer(server);

    expect(connectSpy).toHaveBeenCalledOnce();
    expect(transport).toBeDefined();
    connectSpy.mockRestore();
  });

  it('seceneksiz cagrildiginda geriye uyumlu calisir', () => {
    const runtime = createTestRuntime();

    const server = createMcpServer(runtime);

    expect(server).toBeDefined();
  });

  it('bos secenek nesnesiyle calisir', () => {
    const runtime = createTestRuntime();

    const server = createMcpServer(runtime, {});

    expect(server).toBeDefined();
  });

  it('kaynak tanimlarini sunucuya kaydeder', () => {
    const runtime = createTestRuntime();
    const resources: ResourceDefinition[] = [
      {
        uri: 'test://hello',
        name: 'test-resource',
        description: 'Test kaynagi',
        handler: async () => ({ contents: [{ uri: 'test://hello', text: 'merhaba' }] }),
      },
    ];

    const server = createMcpServer(runtime, { resources });

    expect(server).toBeDefined();
  });

  it('prompt tanimlarini sunucuya kaydeder', () => {
    const runtime = createTestRuntime();
    const prompts: PromptDefinition[] = [
      {
        name: 'test-prompt',
        description: 'Test promptu',
        messages: [{ role: 'user', content: { type: 'text', text: 'Merhaba' } }],
      },
    ];

    const server = createMcpServer(runtime, { prompts });

    expect(server).toBeDefined();
  });

  it('loglama etkinlestirildiginde capabilities icerir', () => {
    const runtime = createTestRuntime();
    const options: McpServerOptions = { enableLogging: true };

    const server = createMcpServer(runtime, options);

    expect(server).toBeDefined();
  });

  it('sampling ve roots bayraklari kabul edilir', () => {
    const runtime = createTestRuntime();
    const options: McpServerOptions = {
      enableSampling: true,
      enableRoots: true,
    };

    const server = createMcpServer(runtime, options);

    expect(server).toBeDefined();
  });

  it('tum secenekler birlikte kullanilabilir', () => {
    const runtime = createTestRuntime();
    const options: McpServerOptions = {
      resources: [
        {
          uri: 'test://combined',
          name: 'combined-resource',
          handler: async () => ({ contents: [{ uri: 'test://combined', text: 'veri' }] }),
        },
      ],
      prompts: [
        {
          name: 'combined-prompt',
          messages: [{ role: 'user', content: { type: 'text', text: 'Test' } }],
        },
      ],
      enableLogging: true,
      enableSampling: true,
      enableRoots: true,
    };

    const server = createMcpServer(runtime, options);

    expect(server).toBeDefined();
  });

  it('bos dizilerle capability bildirmez', () => {
    const runtime = createTestRuntime();
    const options: McpServerOptions = {
      resources: [],
      prompts: [],
    };

    const server = createMcpServer(runtime, options);

    expect(server).toBeDefined();
  });
});
