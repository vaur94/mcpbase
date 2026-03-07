import { describe, expect, it, vi } from 'vitest';

import { ApplicationRuntime } from '../../src/application/runtime.js';
import { createExampleTools } from '../../src/application/example-tools.js';
import { StderrLogger } from '../../src/logging/stderr-logger.js';
import { createMcpServer } from '../../src/transport/mcp/server.js';
import type { StreamableHttpOptions } from '../../src/transport/mcp/streamable-http.js';
import { createFixtureConfig } from '../fixtures/runtime-config.js';

const mockHandleRequest = vi.fn().mockResolvedValue(undefined);
const mockSessionId = vi.fn().mockReturnValue(undefined);
let capturedOptions: Record<string, unknown> = {};

vi.mock('@modelcontextprotocol/sdk/server/streamableHttp.js', () => ({
  StreamableHTTPServerTransport: vi.fn().mockImplementation((opts: Record<string, unknown>) => {
    capturedOptions = opts;
    const sessionIdGen = opts['sessionIdGenerator'] as (() => string) | undefined;
    const sid = sessionIdGen ? sessionIdGen() : undefined;
    mockSessionId.mockReturnValue(sid);
    return {
      handleRequest: mockHandleRequest,
      get sessionId() {
        return mockSessionId();
      },
    };
  }),
}));

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
    const { startStreamableHttpServer } =
      await import('../../src/transport/mcp/streamable-http.js');
    const server = createTestServer();
    const connectSpy = vi.spyOn(server, 'connect').mockResolvedValue(undefined as never);

    const fakeReq = {} as StreamableHttpOptions['req'];
    const fakeRes = {} as StreamableHttpOptions['res'];

    const transport = await startStreamableHttpServer(server, { req: fakeReq, res: fakeRes });

    expect(connectSpy).toHaveBeenCalledOnce();
    expect(transport).toBeDefined();
    expect(mockHandleRequest).toHaveBeenCalledWith(fakeReq, fakeRes, undefined);

    connectSpy.mockRestore();
    mockHandleRequest.mockClear();
  });

  it('sessionId secenegi verilmezse sessionIdGenerator undefined olur', async () => {
    const { startStreamableHttpServer } =
      await import('../../src/transport/mcp/streamable-http.js');
    const server = createTestServer();
    const connectSpy = vi.spyOn(server, 'connect').mockResolvedValue(undefined as never);

    const transport = await startStreamableHttpServer(server, {
      req: {} as StreamableHttpOptions['req'],
      res: {} as StreamableHttpOptions['res'],
    });

    expect(capturedOptions['sessionIdGenerator']).toBeUndefined();
    expect(transport.sessionId).toBeUndefined();

    connectSpy.mockRestore();
    mockHandleRequest.mockClear();
  });

  it('sessionId secenegi verilirse transport uzerinde erisilebilinir', async () => {
    const { startStreamableHttpServer } =
      await import('../../src/transport/mcp/streamable-http.js');
    const server = createTestServer();
    const connectSpy = vi.spyOn(server, 'connect').mockResolvedValue(undefined as never);

    const transport = await startStreamableHttpServer(server, {
      req: {} as StreamableHttpOptions['req'],
      res: {} as StreamableHttpOptions['res'],
      sessionId: 'test-session-42',
    });

    expect(transport.sessionId).toBe('test-session-42');

    connectSpy.mockRestore();
    mockHandleRequest.mockClear();
  });

  it('parsedBody secenegi verilirse handleRequest e iletilir', async () => {
    const { startStreamableHttpServer } =
      await import('../../src/transport/mcp/streamable-http.js');
    const server = createTestServer();
    const connectSpy = vi.spyOn(server, 'connect').mockResolvedValue(undefined as never);

    const fakeReq = {} as StreamableHttpOptions['req'];
    const fakeRes = {} as StreamableHttpOptions['res'];
    const parsedBody = { jsonrpc: '2.0', method: 'initialize' };

    await startStreamableHttpServer(server, {
      req: fakeReq,
      res: fakeRes,
      parsedBody,
    });

    expect(mockHandleRequest).toHaveBeenCalledWith(fakeReq, fakeRes, parsedBody);

    connectSpy.mockRestore();
    mockHandleRequest.mockClear();
  });
});
