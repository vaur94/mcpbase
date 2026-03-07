import process from 'node:process';

import { describe, expect, it, vi } from 'vitest';

import type { McpLogLevel, McpLoggingBridge } from '../../src/capabilities/logging.js';
import { createMcpLoggingBridge } from '../../src/capabilities/logging.js';

function createMockServer() {
  return {
    server: {
      sendLoggingMessage: vi.fn().mockResolvedValue(undefined),
    },
  };
}

describe('McpLoggingBridge arayuzu', () => {
  it('beklenen metotlari saglar', () => {
    const bridge: McpLoggingBridge = createMcpLoggingBridge(createMockServer() as never);

    expect(bridge.log).toBeTypeOf('function');
    expect(bridge.setLevel).toBeTypeOf('function');
  });
});

describe('createMcpLoggingBridge', () => {
  it('varsayilan olarak debug ve uzeri mesajlari istemciye iletir', () => {
    const server = createMockServer();
    const bridge = createMcpLoggingBridge(server as never);

    bridge.log('debug', 'uygulama', { message: 'deneme' });

    expect(server.server.sendLoggingMessage).toHaveBeenCalledOnce();
    expect(server.server.sendLoggingMessage).toHaveBeenCalledWith({
      level: 'debug',
      logger: 'uygulama',
      data: { message: 'deneme' },
    });
  });

  it('esik altindaki mesajlari istemciye iletmez', () => {
    const server = createMockServer();
    const bridge = createMcpLoggingBridge(server as never);

    bridge.setLevel('error');
    bridge.log('info', 'uygulama', { message: 'atlanmali' });

    expect(server.server.sendLoggingMessage).not.toHaveBeenCalled();
  });

  it('esik seviyesindeki mesajlari istemciye iletir', () => {
    const server = createMockServer();
    const bridge = createMcpLoggingBridge(server as never);

    bridge.setLevel('warning');
    bridge.log('warning', 'uygulama', { message: 'iletilecek' });

    expect(server.server.sendLoggingMessage).toHaveBeenCalledOnce();
    expect(server.server.sendLoggingMessage).toHaveBeenCalledWith({
      level: 'warning',
      logger: 'uygulama',
      data: { message: 'iletilecek' },
    });
  });

  it('seviye guncellemelerinde tum MCP log seviyelerini kabul eder', () => {
    const server = createMockServer();
    const bridge = createMcpLoggingBridge(server as never);

    const levels: McpLogLevel[] = [
      'debug',
      'info',
      'notice',
      'warning',
      'error',
      'critical',
      'alert',
      'emergency',
    ];

    for (const level of levels) {
      bridge.setLevel(level);
      bridge.log(level, 'uygulama', { level });
    }

    expect(server.server.sendLoggingMessage).toHaveBeenCalledTimes(levels.length);
  });

  it('istemciye iletim hatasini stderr uzerinden raporlar', async () => {
    const server = createMockServer();
    server.server.sendLoggingMessage.mockRejectedValue(new Error('baglanti koptu'));

    const bridge = createMcpLoggingBridge(server as never);
    const stderrWriteSpy = vi.spyOn(process.stderr, 'write').mockReturnValue(true);

    bridge.log('error', 'uygulama', { message: 'iletilemedi' });
    await Promise.resolve();
    await Promise.resolve();

    expect(stderrWriteSpy).toHaveBeenCalledWith(
      'MCP log mesaji istemciye iletilemedi: baglanti koptu\n',
    );

    stderrWriteSpy.mockRestore();
  });
});
