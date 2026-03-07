import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { StreamableHttpOptions } from '../../src/transport/mcp/streamable-http.js';

const startStdioServerMock = vi.fn();
const startStreamableHttpServerMock = vi.fn();

vi.mock('../../src/transport/mcp/server.js', () => ({
  startStdioServer: startStdioServerMock,
}));

vi.mock('../../src/transport/mcp/streamable-http.js', () => ({
  startStreamableHttpServer: startStreamableHttpServerMock,
}));

describe('transport factory', () => {
  beforeEach(() => {
    startStdioServerMock.mockReset();
    startStreamableHttpServerMock.mockReset();
  });

  it('stdio secildiginde stdio transportunu baslatir', async () => {
    const server = {} as McpServer;
    const stdioTransport = { kind: 'stdio' } as unknown as StdioServerTransport;
    startStdioServerMock.mockResolvedValue(stdioTransport);

    const { createTransport } = await import('../../src/transport/transport-factory.js');

    const result = await createTransport(server, { type: 'stdio' });

    expect(startStdioServerMock).toHaveBeenCalledOnce();
    expect(startStdioServerMock).toHaveBeenCalledWith(server);
    expect(startStreamableHttpServerMock).not.toHaveBeenCalled();
    expect(result).toBe(stdioTransport);
  });

  it('streamable-http secildiginde http transportunu baslatir', async () => {
    const server = {} as McpServer;
    const options = {
      req: {} as StreamableHttpOptions['req'],
      res: {} as StreamableHttpOptions['res'],
      sessionId: 'oturum-1',
      parsedBody: { jsonrpc: '2.0' },
    } satisfies StreamableHttpOptions;
    const httpTransport = { kind: 'streamable-http' } as unknown as StreamableHTTPServerTransport;
    startStreamableHttpServerMock.mockResolvedValue(httpTransport);

    const { createTransport } = await import('../../src/transport/transport-factory.js');

    const result = await createTransport(server, { type: 'streamable-http', options });

    expect(startStreamableHttpServerMock).toHaveBeenCalledOnce();
    expect(startStreamableHttpServerMock).toHaveBeenCalledWith(server, options);
    expect(startStdioServerMock).not.toHaveBeenCalled();
    expect(result).toBe(httpTransport);
  });

  it('barrel export uzerinden factory tiplerini ve fonksiyonunu acar', async () => {
    const indexModule = await import('../../src/index.js');

    expect(indexModule.createTransport).toBeTypeOf('function');
  });
});
