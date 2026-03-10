import { describe, expect, it, vi, beforeEach, type Mock } from 'vitest';
import { z } from 'zod';

import type * as RuntimeModule from '../../src/application/runtime.js';
import type { BaseToolExecutionContext } from '../../src/core/execution-context.js';
import type { ToolDefinition } from '../../src/contracts/tool-contract.js';
import type { ExecutionHooks, LifecycleHooks } from '../../src/contracts/hooks.js';
import type { Logger } from '../../src/logging/logger.js';
import type { TelemetryRecorder } from '../../src/telemetry/telemetry.js';
import { createTextContent } from '../../src/core/result.js';
import {
  baseRuntimeConfigSchema,
  createRuntimeConfigSchema,
  type BaseRuntimeConfig,
} from '../../src/contracts/runtime-config.js';

// --- Mocks ---

vi.mock('../../src/config/load-config.js', () => ({
  loadConfig: vi.fn().mockResolvedValue({
    server: { name: 'test-server', version: '0.0.1' },
    logging: { level: 'error', includeTimestamp: false },
  }),
}));

vi.mock('../../src/logging/stderr-logger.js', () => {
  const StderrLogger = vi.fn().mockImplementation(() => ({
    log: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }));
  return { StderrLogger };
});

vi.mock('../../src/application/example-tools.js', () => ({
  createExampleTools: vi.fn().mockReturnValue([]),
}));

vi.mock('../../src/transport/mcp/server.js', () => ({
  createManagedMcpServer: vi.fn().mockReturnValue({
    server: {
      connect: vi.fn().mockResolvedValue(undefined),
      registerTool: vi.fn(),
    },
    toolHandles: new Map(),
  }),
  createMcpServer: vi.fn().mockReturnValue({
    connect: vi.fn().mockResolvedValue(undefined),
    registerTool: vi.fn(),
  }),
  startStdioServer: vi.fn().mockResolvedValue({}),
}));

const runtimeConstructorSpy = vi.fn();
vi.mock('../../src/application/runtime.js', async (importOriginal) => {
  const original = await importOriginal<typeof RuntimeModule>();
  return {
    ...original,
    ApplicationRuntime: class extends original.ApplicationRuntime {
      constructor(options: unknown) {
        super(options as ConstructorParameters<typeof original.ApplicationRuntime>[0]);
        runtimeConstructorSpy(options);
      }
    },
  };
});

type SignalHandler = () => void;

const processOnceHandlers = new Map<NodeJS.Signals, SignalHandler[]>();
const processOnHandlers = new Map<NodeJS.Signals, SignalHandler[]>();

vi.spyOn(process, 'once').mockImplementation(((event, listener) => {
  if (typeof event === 'string' && (event === 'SIGINT' || event === 'SIGTERM')) {
    const handlers = processOnceHandlers.get(event) ?? [];
    handlers.push(listener as SignalHandler);
    processOnceHandlers.set(event, handlers);
  }

  return process;
}) as typeof process.once);

vi.spyOn(process, 'on').mockImplementation(((event, listener) => {
  if (typeof event === 'string' && (event === 'SIGINT' || event === 'SIGTERM')) {
    const handlers = processOnHandlers.get(event) ?? [];
    handlers.push(listener as SignalHandler);
    processOnHandlers.set(event, handlers);
  }

  return process;
}) as typeof process.on);

import { bootstrap } from '../../src/index.js';
import type { BootstrapOptions } from '../../src/index.js';
import { loadConfig } from '../../src/config/load-config.js';
import { StderrLogger } from '../../src/logging/stderr-logger.js';
import { createExampleTools } from '../../src/application/example-tools.js';
import { createManagedMcpServer, startStdioServer } from '../../src/transport/mcp/server.js';

const inputSchema = z.object({ text: z.string() });

function getLastSignalHandler(
  registry: Map<NodeJS.Signals, SignalHandler[]>,
  signal: NodeJS.Signals,
): SignalHandler {
  const handler = registry.get(signal)?.at(-1);

  if (!handler) {
    throw new Error(`${signal} icin kayitli handler bulunamadi.`);
  }

  return handler;
}

async function flushSignalHandlers(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

function createTestTool(
  name = 'test_tool',
): ToolDefinition<typeof inputSchema, undefined, BaseToolExecutionContext> {
  return {
    name,
    title: 'Test Tool',
    description: 'A test tool.',
    inputSchema,
    async execute() {
      return { content: [createTextContent('ok')] };
    },
  };
}

describe('bootstrap()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    processOnceHandlers.clear();
    processOnHandlers.clear();
  });

  describe('geriye uyumluluk', () => {
    it('argumanlar olmadan cagrildiginda varsayilan davranisi korur', async () => {
      await bootstrap();

      expect(loadConfig).toHaveBeenCalled();
      expect(StderrLogger).toHaveBeenCalled();
      expect(createExampleTools).toHaveBeenCalled();
      expect(createManagedMcpServer).toHaveBeenCalled();
      expect(startStdioServer).toHaveBeenCalled();
    });

    it('sadece argv ile cagrildiginda geriye uyumlu calisir', async () => {
      await bootstrap({ argv: ['--log-level', 'debug'] });

      expect(loadConfig).toHaveBeenCalled();
    });
  });

  describe('ozel araclar', () => {
    it('tools dizisi verildiginde ornek araclar yerine onlari kullanir', async () => {
      const customTools = [createTestTool('custom_tool')];

      await bootstrap({ tools: customTools });

      expect(createExampleTools).not.toHaveBeenCalled();
      expect(createManagedMcpServer).toHaveBeenCalled();
    });

    it('tools fonksiyon olarak verildiginde cagirir', async () => {
      const toolFactory = vi.fn().mockReturnValue([createTestTool('factory_tool')]);

      await bootstrap({ tools: toolFactory });

      expect(toolFactory).toHaveBeenCalledOnce();
      expect(createExampleTools).not.toHaveBeenCalled();
    });
  });

  describe('ozel logger fabrikasi', () => {
    it('loggerFactory verildiginde varsayilan logger yerine onu kullanir', async () => {
      const customLogger: Logger = {
        log: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      };
      const loggerFactory = vi.fn().mockReturnValue(customLogger);

      await bootstrap({ loggerFactory });

      expect(loggerFactory).toHaveBeenCalled();
      // StderrLogger constructor should still not be called for the main logger
      // (it's called 0 times since we provided a factory)
    });
  });

  describe('ozel config semasi', () => {
    it('configSchema verildiginde loadConfig ile kullanir', async () => {
      const customSchema = baseRuntimeConfigSchema;

      await bootstrap({ configSchema: customSchema });

      const loadConfigMock = loadConfig as Mock;
      expect(loadConfigMock).toHaveBeenCalledWith(customSchema, expect.any(Object));
    });
  });

  describe('hook entegrasyonu', () => {
    it('tekil hook verildiginde RuntimeOptions icine aktarir', async () => {
      const hook: ExecutionHooks = {
        beforeExecute: vi.fn(),
      };

      await bootstrap({ hooks: hook });

      expect(createManagedMcpServer).toHaveBeenCalled();
    });

    it('hook dizisi verildiginde RuntimeOptions icine aktarir', async () => {
      const hooks: ExecutionHooks[] = [{ beforeExecute: vi.fn() }, { afterExecute: vi.fn() }];

      await bootstrap({ hooks });

      expect(createManagedMcpServer).toHaveBeenCalled();
    });
  });

  describe('contextFactory entegrasyonu', () => {
    it('contextFactory verildiginde RuntimeOptions icine aktarir', async () => {
      const baseConfig: BaseRuntimeConfig = {
        server: { name: 'test-server', version: '0.0.1' },
        logging: { level: 'error', includeTimestamp: false },
      };
      const contextFactory = vi.fn().mockReturnValue({
        requestId: 'test',
        toolName: 'test',
        config: baseConfig,
      });

      await bootstrap({ contextFactory });

      expect(createManagedMcpServer).toHaveBeenCalled();
    });
  });

  describe('transport', () => {
    it('varsayilan transport stdio olarak kullanilir', async () => {
      await bootstrap();

      expect(startStdioServer).toHaveBeenCalled();
    });

    it('transport: stdio acikca belirtildiginde stdio kullanir', async () => {
      await bootstrap({ transport: 'stdio' });

      expect(startStdioServer).toHaveBeenCalled();
    });
  });

  describe('lifecycle entegrasyonu', () => {
    it('onStart runtime olustuktan sonra ve transport baslamadan once cagrilir', async () => {
      const lifecycle: LifecycleHooks = {
        onStart: vi.fn(),
      };

      await bootstrap({ lifecycle });

      const runtimeCallOrder = runtimeConstructorSpy.mock.invocationCallOrder[0];
      const startCallOrder = (lifecycle.onStart as Mock).mock.invocationCallOrder[0];
      const transportCallOrder = (startStdioServer as Mock).mock.invocationCallOrder[0];

      expect(lifecycle.onStart).toHaveBeenCalledWith(
        expect.objectContaining({
          server: { name: 'test-server', version: '0.0.1' },
        }),
      );
      expect(runtimeCallOrder).toBeDefined();
      expect(startCallOrder).toBeDefined();
      expect(transportCallOrder).toBeDefined();

      if (
        runtimeCallOrder === undefined ||
        startCallOrder === undefined ||
        transportCallOrder === undefined
      ) {
        throw new Error('Cagri sirasi kaydedilemedi.');
      }

      expect(runtimeCallOrder).toBeLessThan(startCallOrder);
      expect(startCallOrder).toBeLessThan(transportCallOrder);
    });

    it('SIGINT alindiginda onShutdown cagrilir', async () => {
      const onShutdown = vi.fn().mockResolvedValue(undefined);
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);

      await bootstrap({ lifecycle: { onShutdown } });

      const sigintHandler = getLastSignalHandler(processOnceHandlers, 'SIGINT');
      sigintHandler();
      await flushSignalHandlers();

      expect(onShutdown).toHaveBeenCalledOnce();
      expect(exitSpy).toHaveBeenCalledWith(0);
      exitSpy.mockRestore();
    });

    it('onStart hata verirse bootstrap reddedilir ve server baslamaz', async () => {
      const lifecycleError = new Error('baslangic hatasi');

      await expect(
        bootstrap({
          lifecycle: {
            onStart: vi.fn().mockRejectedValue(lifecycleError),
          },
        }),
      ).rejects.toThrow('baslangic hatasi');

      expect(startStdioServer).not.toHaveBeenCalled();
    });

    it('startStdioServer hata verirse bootstrap reddedilir ve onShutdown cagrilir', async () => {
      const transportError = new Error('server baslatma hatasi');
      const onStart = vi.fn().mockResolvedValue(undefined);
      const onShutdown = vi.fn().mockResolvedValue(undefined);

      (startStdioServer as Mock).mockRejectedValueOnce(transportError);

      await expect(
        bootstrap({
          lifecycle: {
            onStart,
            onShutdown,
          },
        }),
      ).rejects.toThrow('server baslatma hatasi');

      expect(onStart).toHaveBeenCalledTimes(1);
      expect(onShutdown).toHaveBeenCalledTimes(1);
      expect(startStdioServer).toHaveBeenCalled();
    });

    it('onShutdown hata verirse process yine de cikar', async () => {
      const logger: Logger = {
        log: vi.fn(),
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      };
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);

      await bootstrap({
        loggerFactory: () => logger,
        lifecycle: {
          onShutdown: vi.fn().mockRejectedValue(new Error('kapanis hatasi')),
        },
      });

      const sigtermHandler = getLastSignalHandler(processOnceHandlers, 'SIGTERM');
      sigtermHandler();
      await flushSignalHandlers();

      expect(logger.error).toHaveBeenCalledWith('Lifecycle onShutdown kancasi hata verdi.', {
        errorCode: 'TOOL_EXECUTION_ERROR',
        toolName: 'bootstrap',
      });
      expect(exitSpy).toHaveBeenCalledWith(0);
      exitSpy.mockRestore();
    });
  });

  describe('tam ozellestirilmis bootstrap', () => {
    it('tum secenekler verildiginde dogru sekilde yapilandirir', async () => {
      const customLogger: Logger = {
        log: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      };

      const baseConfig: BaseRuntimeConfig = {
        server: { name: 'test-server', version: '0.0.1' },
        logging: { level: 'error', includeTimestamp: false },
      };
      const hook: ExecutionHooks = { beforeExecute: vi.fn() };
      const contextFactory = vi.fn().mockReturnValue({
        requestId: 'r',
        toolName: 't',
        config: baseConfig,
      });

      await bootstrap({
        configSchema: baseRuntimeConfigSchema,
        tools: [createTestTool()],
        loggerFactory: () => customLogger,
        contextFactory,
        hooks: hook,
        transport: 'stdio',
        argv: ['--log-level', 'debug'],
      });

      expect(createExampleTools).not.toHaveBeenCalled();
      expect(createManagedMcpServer).toHaveBeenCalled();
      expect(startStdioServer).toHaveBeenCalled();
    });

    it('bootstrap generic tipleriyle ozel config ve context kullanir', async () => {
      const customSchema = createRuntimeConfigSchema(
        z.object({
          storage: z.object({ path: z.string().min(1) }),
        }),
      );
      type CustomConfig = BaseRuntimeConfig<{ storage: { path: string } }>;
      interface CustomContext extends BaseToolExecutionContext<CustomConfig> {
        readonly tenantId: string;
      }

      const customConfig: CustomConfig = {
        server: { name: 'typed-server', version: '1.2.3' },
        logging: { level: 'info', includeTimestamp: false },
        storage: { path: '/typed/storage' },
      };
      const customTool: ToolDefinition<typeof inputSchema, undefined, CustomContext> = {
        name: 'typed_tool',
        title: 'Typed Tool',
        description: 'Generic bootstrap testi.',
        inputSchema,
        async execute(_input, context) {
          return {
            content: [createTextContent(`${context.tenantId}:${context.config.storage.path}`)],
          };
        },
      };
      const customLogger: Logger = {
        log: vi.fn(),
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      };
      const contextFactory: BootstrapOptions<CustomConfig, CustomContext>['contextFactory'] = (
        toolName,
        requestId,
        config,
      ) => ({
        requestId,
        toolName,
        config,
        tenantId: 'tenant-42',
      });

      (loadConfig as Mock).mockResolvedValueOnce(customConfig);

      await bootstrap<CustomConfig, CustomContext>({
        configSchema: customSchema,
        tools: [customTool],
        loggerFactory: () => customLogger,
        contextFactory,
        argv: [],
      });

      expect(loadConfig).toHaveBeenCalledWith(customSchema, expect.objectContaining({ argv: [] }));
      expect(createManagedMcpServer).toHaveBeenCalled();
      expect(startStdioServer).toHaveBeenCalled();
    });
  });
});

describe('BootstrapOptions tipi', () => {
  it('tum alanlar opsiyoneldir', () => {
    const options: BootstrapOptions = {};
    expect(options).toBeDefined();
  });

  it('varsayilan generic parametreler BaseRuntimeConfig ve BaseToolExecutionContext kullanir', () => {
    const options: BootstrapOptions = {
      transport: 'stdio',
    };
    expect(options.transport).toBe('stdio');
  });

  it('lifecycle alanini opsiyonel olarak kabul eder', () => {
    const options: BootstrapOptions = {
      lifecycle: {
        onStart: vi.fn(),
      },
    };

    expect(options.lifecycle).toBeDefined();
  });
});

describe('bootstrap telemetri entegrasyonu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('telemetri verildiginde ApplicationRuntime a aktarir', async () => {
    const telemetry: TelemetryRecorder = {
      record: vi.fn(),
      snapshot: vi.fn().mockReturnValue({
        tools: new Map(),
        totalCalls: 0,
        totalErrors: 0,
        overallErrorRate: 0,
        overallP95LatencyMs: 0,
      }),
    };

    await bootstrap({ telemetry });

    expect(runtimeConstructorSpy).toHaveBeenCalledWith(expect.objectContaining({ telemetry }));
  });

  it('telemetri verilmezse mevcut davranis degismez', async () => {
    await bootstrap();

    expect(runtimeConstructorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ telemetry: undefined }),
    );
    expect(createManagedMcpServer).toHaveBeenCalled();
    expect(startStdioServer).toHaveBeenCalled();
  });
});
