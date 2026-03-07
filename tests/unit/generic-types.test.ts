import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  AppError,
  ApplicationRuntime,
  ToolRegistry,
  bootstrap,
  createRuntimeConfigSchema,
  createTextContent,
  isErrorResult,
  loadConfig,
} from '../../src/index.js';
import type {
  BaseRuntimeConfig,
  BaseToolExecutionContext,
  BootstrapOptions,
  ExecutionHooks,
  Logger,
  ToolDefinition,
} from '../../src/index.js';

type StorageConfig = BaseRuntimeConfig<{
  storage: {
    path: string;
    enabled: boolean;
  };
}>;

interface StorageContext extends BaseToolExecutionContext<StorageConfig> {
  readonly tenantId: string;
}

const storageSchema = createRuntimeConfigSchema(
  z.object({
    storage: z.object({
      path: z.string().min(1),
      enabled: z.boolean(),
    }),
  }),
);

const storageInputSchema = z.object({ key: z.string().min(1) });
const storageOutputSchema = z.object({
  location: z.string(),
  tenantId: z.string(),
});

function createLogger(): Logger {
  return {
    log() {},
    debug() {},
    info() {},
    warn() {},
    error() {},
  };
}

function createStorageConfig(overrides: Partial<StorageConfig> = {}): StorageConfig {
  return {
    server: { name: 'typed-server', version: '1.0.0' },
    logging: { level: 'info', includeTimestamp: false },
    storage: { path: '/tmp/storage', enabled: true },
    ...overrides,
  };
}

function createStorageContext(config: StorageConfig = createStorageConfig()): StorageContext {
  return {
    requestId: 'req-storage',
    toolName: 'storage_tool',
    config,
    tenantId: 'tenant-42',
  };
}

function createStorageTool(): ToolDefinition<
  typeof storageInputSchema,
  typeof storageOutputSchema,
  StorageContext
> {
  return {
    name: 'storage_tool',
    title: 'Storage Tool',
    description: 'Generic type dogrulama araci.',
    inputSchema: storageInputSchema,
    outputSchema: storageOutputSchema,
    async execute(input, context) {
      return {
        content: [createTextContent(`${context.tenantId}:${input.key}`)],
        structuredContent: {
          location: `${context.config.storage.path}/${input.key}`,
          tenantId: context.tenantId,
        },
      };
    },
  };
}

describe('generic tipler', () => {
  it('BaseRuntimeConfig<TExtras> ozel alanlari korur', () => {
    const config: StorageConfig = createStorageConfig({
      storage: { path: '/data/archive', enabled: true },
    });

    expect(config.storage.path).toBe('/data/archive');
    expect(config.storage.enabled).toBe(true);
  });

  it('AppError<TCode> ozel hata kodunu korur', () => {
    type StorageErrorCode = 'STORAGE_ERROR' | 'NETWORK_ERROR';
    const error = new AppError<StorageErrorCode>('STORAGE_ERROR', 'Depolama hatasi');

    expect(error.code).toBe('STORAGE_ERROR');
  });

  it('BaseToolExecutionContext<TConfig> config tipini baglar', () => {
    const context: StorageContext = createStorageContext();

    expect(context.config.storage.path).toBe('/tmp/storage');
    expect(context.tenantId).toBe('tenant-42');
  });

  it('ToolDefinition<I, O, TContext> input, output ve context tiplerini birlikte kullanir', async () => {
    const tool = createStorageTool();
    const result = await tool.execute({ key: 'report.json' }, createStorageContext());

    expect(result.structuredContent).toEqual({
      location: '/tmp/storage/report.json',
      tenantId: 'tenant-42',
    });
  });

  it('ToolRegistry<TContext> ozel context tipli araci dondurur', async () => {
    const registry = new ToolRegistry<StorageContext>();
    registry.register(createStorageTool());

    const tool = registry.get('storage_tool');
    const result = await tool.execute({ key: 'file.txt' }, createStorageContext());

    expect(result.content[0]?.text).toBe('tenant-42:file.txt');
  });

  it('ApplicationRuntime<TConfig, TContext> ozel config ve context ile calisir', async () => {
    let capturedContext: StorageContext | undefined;
    const tool: ToolDefinition<
      typeof storageInputSchema,
      typeof storageOutputSchema,
      StorageContext
    > = {
      ...createStorageTool(),
      async execute(input, context) {
        capturedContext = context;
        return createStorageTool().execute(input, context);
      },
    };
    const config = createStorageConfig({
      storage: { path: '/var/lib/storage', enabled: true },
    });
    const runtime = new ApplicationRuntime<StorageConfig, StorageContext>({
      config,
      logger: createLogger(),
      tools: [tool],
      contextFactory: (toolName, requestId, runtimeConfig) => ({
        requestId,
        toolName,
        config: runtimeConfig,
        tenantId: 'tenant-runtime',
      }),
    });

    const result = await runtime.executeTool('storage_tool', { key: 'runtime.log' });

    expect(capturedContext?.tenantId).toBe('tenant-runtime');
    expect(capturedContext?.config.storage.path).toBe('/var/lib/storage');
    if (isErrorResult(result)) {
      throw new Error('Basarili sonuc bekleniyordu.');
    }
    expect(result.structuredContent).toEqual({
      location: '/var/lib/storage/runtime.log',
      tenantId: 'tenant-runtime',
    });
  });

  it('ExecutionHooks<TContext> ozel context tipini hooklara tasir', async () => {
    const seenTenants: string[] = [];
    const hooks: ExecutionHooks<StorageContext> = {
      beforeExecute(_tool, _input, context) {
        seenTenants.push(`before:${context.tenantId}`);
      },
      afterExecute(_tool, _input, result, context) {
        seenTenants.push(`after:${context.tenantId}:${String(result.structuredContent?.tenantId)}`);
      },
    };
    const runtime = new ApplicationRuntime<StorageConfig, StorageContext>({
      config: createStorageConfig(),
      logger: createLogger(),
      tools: [createStorageTool()],
      hooks,
      contextFactory: (toolName, requestId, config) => ({
        requestId,
        toolName,
        config,
        tenantId: 'tenant-hook',
      }),
    });

    await runtime.executeTool('storage_tool', { key: 'hook.txt' });

    expect(seenTenants).toEqual(['before:tenant-hook', 'after:tenant-hook:tenant-hook']);
  });

  it('loadConfig<TConfig> ozel config tipini dondurur', async () => {
    const tempDir = await mkdtemp(path.join(tmpdir(), 'mcpbase-generic-types-'));
    const configPath = path.join(tempDir, 'storage.config.json');

    await writeFile(
      configPath,
      JSON.stringify({
        server: { name: 'storage-server', version: '2.0.0' },
        logging: { level: 'warn', includeTimestamp: true },
        storage: { path: '/srv/storage', enabled: true },
      }),
      'utf8',
    );

    const result = await loadConfig<StorageConfig>(storageSchema, {
      defaultConfigFile: configPath,
      argv: [],
    });

    expect(result.storage.path).toBe('/srv/storage');
    expect(result.storage.enabled).toBe(true);
  });

  it('bootstrap<TConfig, TContext> ozel BootstrapOptions ile uyumlu imzaya sahiptir', () => {
    const options: BootstrapOptions<StorageConfig, StorageContext> = {
      configSchema: storageSchema,
      tools: [createStorageTool()],
      loggerFactory: (config) => {
        expect(config.storage.path).toBe('/tmp/storage');
        return createLogger();
      },
      contextFactory: (toolName, requestId, config) => ({
        requestId,
        toolName,
        config,
        tenantId: 'tenant-bootstrap',
      }),
      transport: 'stdio',
      argv: [],
    };
    const typedBootstrap: (
      options?: BootstrapOptions<StorageConfig, StorageContext>,
    ) => Promise<void> = bootstrap;

    expect(options.transport).toBe('stdio');
    expect(typedBootstrap).toBeTypeOf('function');
  });
});
