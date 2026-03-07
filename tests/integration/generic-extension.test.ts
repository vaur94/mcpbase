import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

vi.mock('../../src/infrastructure/json-file.js', () => ({
  fileExists: vi.fn(async () => false),
  readJsonFile: vi.fn(async () => {
    throw new Error('JSON dosyasi okunmamali.');
  }),
}));

import {
  ApplicationRuntime,
  ToolRegistry,
  createRuntimeConfigSchema,
  createTextContent,
  ensureAppError,
  envName,
  isErrorResult,
  loadConfig,
} from '../../src/index.js';
import type { LifecycleHooks } from '../../src/index.js';
import type { ToolDefinition } from '../../src/contracts/tool-contract.js';
import type { BaseToolExecutionContext } from '../../src/core/execution-context.js';
import { StderrLogger } from '../../src/logging/stderr-logger.js';
import { assertFeatureEnabled, createSecurityEnforcementHook } from '../../src/security/index.js';
import type { SecureToolDefinition, SecurityConfig } from '../../src/security/index.js';

const trackedEnv = ['CHILD_SERVER_NAME', 'CHILD_STORAGE_PATH'] as const;
const envSnapshot = Object.fromEntries(trackedEnv.map((key) => [key, process.env[key]]));

const extensionSchema = z.object({
  storage: z.object({
    path: z.string().min(1),
  }),
});

const configSchema = createRuntimeConfigSchema(extensionSchema);

type MyConfig = z.infer<typeof configSchema>;

interface MyContext extends BaseToolExecutionContext<MyConfig> {
  readonly storage: {
    readonly path: string;
  };
}

function createTestLogger() {
  return new StderrLogger({ level: 'error', includeTimestamp: false });
}

function createStorageCliOverrides(args: string[]): Partial<MyConfig> {
  const pathIndex = args.indexOf('--storage-path');
  const pathValue = pathIndex === -1 ? undefined : args[pathIndex + 1];

  if (!pathValue) {
    return {};
  }

  return {
    storage: {
      path: pathValue,
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();

  for (const key of trackedEnv) {
    const original = envSnapshot[key];
    if (original === undefined) {
      delete process.env[key];
      continue;
    }

    process.env[key] = original;
  }
});

describe('generic extension integration', () => {
  it('child server benzeri uzanti akisini tip guvenli sekilde calistirir', async () => {
    process.env.CHILD_SERVER_NAME = 'env-child-server';
    process.env.CHILD_STORAGE_PATH = '/env-storage';

    const config = await loadConfig(configSchema, {
      envPrefix: 'CHILD_',
      defaultConfigFile: '__integration_missing__.json',
      argv: ['--storage-path', '/cli-storage'],
      defaults: {
        storage: {
          path: '/default-storage',
        },
      },
      envMapper: (prefix) => ({
        storage: {
          path: process.env[envName(prefix, 'STORAGE_PATH')] ?? '/default-storage',
        },
      }),
      cliMapper: createStorageCliOverrides,
    });

    const lifecycle: LifecycleHooks<MyConfig> = {
      onStart: vi.fn(),
      onShutdown: vi.fn(),
    };

    const security: SecurityConfig<{ storageRead: boolean }> = {
      features: { storageRead: true },
      commands: { allowed: [] },
      paths: { allowed: [] },
    };

    expect(config.server.name).toBe('env-child-server');
    expect(config.storage.path).toBe('/cli-storage');
    expect(() =>
      assertFeatureEnabled<{ storageRead: boolean }>(security, 'storageRead'),
    ).not.toThrow();

    const readInputSchema = z.object({ filename: z.string().min(1) });
    const readOutputSchema = z.object({
      requestId: z.string().min(1),
      filename: z.string().min(1),
      path: z.string().min(1),
    });
    const failInputSchema = z.object({});

    let capturedContext: MyContext | undefined;

    const storageReadTool: ToolDefinition<
      typeof readInputSchema,
      typeof readOutputSchema,
      MyContext
    > = {
      name: 'storage_read',
      title: 'Storage Read',
      description: 'Depolama yolunu kullanan child server araci.',
      inputSchema: readInputSchema,
      outputSchema: readOutputSchema,
      async execute(input, context) {
        assertFeatureEnabled<{ storageRead: boolean }>(security, 'storageRead');
        capturedContext = context;

        return {
          content: [createTextContent(`${context.storage.path}/${input.filename}`)],
          structuredContent: {
            requestId: context.requestId,
            filename: input.filename,
            path: context.storage.path,
          },
        };
      },
    };

    const storageFailTool: ToolDefinition<typeof failInputSchema, undefined, MyContext> = {
      name: 'storage_fail',
      title: 'Storage Fail',
      description: 'Custom error code ile normalize hata dondurur.',
      inputSchema: failInputSchema,
      async execute() {
        throw ensureAppError(new Error('x'), 'STORAGE_ERROR');
      },
    };

    const registry = new ToolRegistry<MyContext>();
    registry.register(storageReadTool);
    registry.register(storageFailTool);

    expect(registry.has('storage_read')).toBe(true);
    expect(registry.has('missing')).toBe(false);
    expect(registry.tryGet('storage_read')).toBe(storageReadTool);
    expect(registry.tryGet('missing')).toBeUndefined();

    await lifecycle.onStart?.(config);

    const runtime = new ApplicationRuntime<MyConfig, MyContext>({
      config,
      logger: createTestLogger(),
      tools: [storageReadTool, storageFailTool],
      contextFactory: (toolName, requestId, runtimeConfig) => ({
        requestId,
        toolName,
        config: runtimeConfig,
        storage: {
          path: runtimeConfig.storage.path,
        },
      }),
    });

    const successResult = await runtime.executeTool('storage_read', {
      filename: 'notes.txt',
    });

    if (isErrorResult(successResult)) {
      throw new Error('Basarili sonuc bekleniyordu.');
    }

    expect(successResult.structuredContent).toEqual({
      requestId: expect.any(String),
      filename: 'notes.txt',
      path: '/cli-storage',
    });
    expect(successResult.content[0]?.text).toBe('/cli-storage/notes.txt');
    expect(capturedContext?.storage.path).toBe('/cli-storage');
    expect(capturedContext?.config.storage.path).toBe('/cli-storage');

    const errorResult = await runtime.executeTool('storage_fail', {});

    expect(errorResult.isError).toBe(true);
    if (!isErrorResult(errorResult)) {
      throw new Error('Hata sonucu bekleniyordu.');
    }

    expect(errorResult.error).toMatchObject({
      code: 'STORAGE_ERROR',
      message: 'Unexpected error',
    });

    await lifecycle.onShutdown?.();

    expect(lifecycle.onStart).toHaveBeenCalledWith(config);
    expect(lifecycle.onShutdown).toHaveBeenCalledOnce();
  });

  it('SecureToolDefinition ve security enforcement hook birlikte calisir', async () => {
    const config = configSchema.parse({
      server: { name: 'child-server', version: '1.0.0' },
      logging: { level: 'info', includeTimestamp: false },
      storage: { path: '/secure-storage' },
    });

    const readInputSchema = z.object({ filename: z.string().min(1) });
    const disabledSecurity: SecurityConfig<{ storageRead: boolean }> = {
      features: { storageRead: false },
      commands: { allowed: [] },
      paths: { allowed: [] },
    };

    let executed = false;

    const secureTool: SecureToolDefinition<typeof readInputSchema, undefined, MyContext> = {
      name: 'secure_storage_read',
      title: 'Secure Storage Read',
      description: 'Feature aciksa calisir.',
      inputSchema: readInputSchema,
      security: {
        requiredFeature: 'storageRead',
      },
      async execute(input) {
        executed = true;
        return {
          content: [createTextContent(input.filename)],
        };
      },
    };

    const runtime = new ApplicationRuntime<MyConfig, MyContext>({
      config,
      logger: createTestLogger(),
      tools: [secureTool],
      hooks: {
        beforeExecute: createSecurityEnforcementHook(disabledSecurity),
      },
      contextFactory: (toolName, requestId, runtimeConfig) => ({
        requestId,
        toolName,
        config: runtimeConfig,
        storage: {
          path: runtimeConfig.storage.path,
        },
      }),
    });

    const result = await runtime.executeTool('secure_storage_read', {
      filename: 'secret.txt',
    });

    expect(result.isError).toBe(true);
    if (!isErrorResult(result)) {
      throw new Error('Hata sonucu bekleniyordu.');
    }

    expect(result.error).toMatchObject({ code: 'PERMISSION_DENIED' });
    expect(executed).toBe(false);
  });
});
