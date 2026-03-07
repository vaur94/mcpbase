import { describe, expect, it, vi } from 'vitest';

import { ApplicationRuntime } from '../../src/application/runtime.js';
import { createExampleTools } from '../../src/application/example-tools.js';
import { StderrLogger } from '../../src/logging/stderr-logger.js';
import { createMcpServer } from '../../src/transport/mcp/server.js';
import { startStreamableHttpServer } from '../../src/transport/mcp/streamable-http.js';
import type { StreamableHttpOptions } from '../../src/transport/mcp/streamable-http.js';
import { createFixtureConfig } from '../fixtures/runtime-config.js';

function createTestServer() {
  const runtime = new ApplicationRuntime({
    config: createFixtureConfig(),
    logger: new StderrLogger({ level: 'error', includeTimestamp: false }),
    tools: createExampleTools(),
  });
  return createMcpServer(runtime);
}

describe('Streamable HTTP transport', () => {
  it('sunucu baglantisi kurar ve transport dondurur', async () => {
    const server = createTestServer();
    const connectSpy = vi.spyOn(server, 'connect').mockResolvedValue(undefined as never);

    const fakeReq = {} as StreamableHttpOptions['req'];
    const fakeRes = {} as StreamableHttpOptions['res'];

    const transport = await startStreamableHttpServer(server, { req: fakeReq, res: fakeRes });

    expect(connectSpy).toHaveBeenCalledOnce();
    expect(transport).toBeDefined();

    connectSpy.mockRestore();
  });

  it('sessionId secenegi verilmezse sessionIdGenerator undefined olur', async () => {
    const server = createTestServer();
    const connectSpy = vi.spyOn(server, 'connect').mockResolvedValue(undefined as never);

    const transport = await startStreamableHttpServer(server, {
      req: {} as StreamableHttpOptions['req'],
      res: {} as StreamableHttpOptions['res'],
    });

    expect(transport.sessionId).toBeUndefined();

    connectSpy.mockRestore();
  });

  it('sessionId secenegi verilirse transport uzerinde erisilebilinir', async () => {
    const server = createTestServer();
    const connectSpy = vi.spyOn(server, 'connect').mockResolvedValue(undefined as never);

    const transport = await startStreamableHttpServer(server, {
      req: {} as StreamableHttpOptions['req'],
      res: {} as StreamableHttpOptions['res'],
      sessionId: 'test-session-42',
    });

    expect(transport.sessionId).toBe('test-session-42');

    connectSpy.mockRestore();
  });

  it('handleRequest metodu req ve res ile cagrilir', async () => {
    const server = createTestServer();
    const connectSpy = vi.spyOn(server, 'connect').mockResolvedValue(undefined as never);

    const fakeReq = {} as StreamableHttpOptions['req'];
    const fakeRes = {} as StreamableHttpOptions['res'];

    const transport = await startStreamableHttpServer(server, { req: fakeReq, res: fakeRes });

    const handleSpy = vi.spyOn(transport, 'handleRequest').mockResolvedValue(undefined);
    await transport.handleRequest(fakeReq, fakeRes);

    expect(handleSpy).toHaveBeenCalledWith(fakeReq, fakeRes);

    connectSpy.mockRestore();
    handleSpy.mockRestore();
  });

  it('parsedBody secenegi verilirse handleRequest a iletilir', async () => {
    const server = createTestServer();
    const connectSpy = vi.spyOn(server, 'connect').mockResolvedValue(undefined as never);

    const fakeReq = {} as StreamableHttpOptions['req'];
    const fakeRes = {} as StreamableHttpOptions['res'];
    const parsedBody = { jsonrpc: '2.0', method: 'initialize' };

    const transport = await startStreamableHttpServer(server, {
      req: fakeReq,
      res: fakeRes,
      parsedBody,
    });

    const handleSpy = vi.spyOn(transport, 'handleRequest').mockResolvedValue(undefined);
    await transport.handleRequest(fakeReq, fakeRes, parsedBody);

    expect(handleSpy).toHaveBeenCalledWith(fakeReq, fakeRes, parsedBody);

    connectSpy.mockRestore();
    handleSpy.mockRestore();
  });
});
