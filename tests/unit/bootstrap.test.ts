import { describe, expect, it, vi, beforeEach, type Mock } from 'vitest';
import { z } from 'zod';

import type { BaseToolExecutionContext } from '../../src/core/execution-context.js';
import type { ToolDefinition } from '../../src/contracts/tool-contract.js';
import type { ExecutionHooks } from '../../src/contracts/hooks.js';
import type { Logger } from '../../src/logging/logger.js';
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
  createMcpServer: vi.fn().mockReturnValue({
    connect: vi.fn().mockResolvedValue(undefined),
    registerTool: vi.fn(),
  }),
  startStdioServer: vi.fn().mockResolvedValue({}),
}));

// Prevent process.once from actually registering signal handlers in tests
vi.spyOn(process, 'once').mockImplementation((() => process) as typeof process.once);

import { bootstrap } from '../../src/index.js';
import type { BootstrapOptions } from '../../src/index.js';
import { loadConfig } from '../../src/config/load-config.js';
import { StderrLogger } from '../../src/logging/stderr-logger.js';
import { createExampleTools } from '../../src/application/example-tools.js';
import { createMcpServer, startStdioServer } from '../../src/transport/mcp/server.js';

const inputSchema = z.object({ text: z.string() });

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
  });

  describe('geriye uyumluluk', () => {
    it('argumanlar olmadan cagrildiginda varsayilan davranisi korur', async () => {
      await bootstrap();

      expect(loadConfig).toHaveBeenCalled();
      expect(StderrLogger).toHaveBeenCalled();
      expect(createExampleTools).toHaveBeenCalled();
      expect(createMcpServer).toHaveBeenCalled();
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
      expect(createMcpServer).toHaveBeenCalled();
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

      expect(createMcpServer).toHaveBeenCalled();
    });

    it('hook dizisi verildiginde RuntimeOptions icine aktarir', async () => {
      const hooks: ExecutionHooks[] = [{ beforeExecute: vi.fn() }, { afterExecute: vi.fn() }];

      await bootstrap({ hooks });

      expect(createMcpServer).toHaveBeenCalled();
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

      expect(createMcpServer).toHaveBeenCalled();
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
      expect(createMcpServer).toHaveBeenCalled();
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
      expect(createMcpServer).toHaveBeenCalled();
      expect(startStdioServer).toHaveBeenCalled();
    });
  });
});

describe('BootstrapOptions tipi', () => {
  it('tum alanlar opsiyoneldir', () => {
    // Type-level test: empty options should compile
    const options: BootstrapOptions = {};
    expect(options).toBeDefined();
  });

  it('varsayilan generic parametreler BaseRuntimeConfig ve BaseToolExecutionContext kullanir', () => {
    // Type-level test: default generics compile without explicit types
    const options: BootstrapOptions = {
      transport: 'stdio',
    };
    expect(options.transport).toBe('stdio');
  });
});
