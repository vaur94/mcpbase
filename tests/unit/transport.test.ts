import { describe, expect, it, vi } from 'vitest';

import { ApplicationRuntime } from '../../src/application/runtime.js';
import { createExampleTools } from '../../src/application/example-tools.js';
import { StderrLogger } from '../../src/logging/stderr-logger.js';
import { createMcpServer, startStdioServer } from '../../src/transport/mcp/server.js';
import { createFixtureConfig } from '../fixtures/runtime-config.js';

describe('MCP transport', () => {
  it('runtime araclarini MCP sunucusuna kaydeder', () => {
    const runtime = new ApplicationRuntime(
      createFixtureConfig(),
      new StderrLogger({ level: 'error', includeTimestamp: false }),
      createExampleTools(),
    );

    const server = createMcpServer(runtime);

    expect(server).toBeDefined();
  });

  it('stdio transport ile baglanti kurar', async () => {
    const runtime = new ApplicationRuntime(
      createFixtureConfig(),
      new StderrLogger({ level: 'error', includeTimestamp: false }),
      createExampleTools(),
    );
    const server = createMcpServer(runtime);
    const connectSpy = vi.spyOn(server, 'connect').mockResolvedValue(undefined as never);

    const transport = await startStdioServer(server);

    expect(connectSpy).toHaveBeenCalledOnce();
    expect(transport).toBeDefined();
    connectSpy.mockRestore();
  });
});
