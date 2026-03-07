import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';
import { z } from 'zod';

import { loadConfig, envName, envBoolean, envList } from '../../src/config/load-config.js';
import { defaultConfig } from '../../src/config/default-config.js';
import {
  createRuntimeConfigSchema,
  runtimeConfigSchema,
} from '../../src/contracts/runtime-config.js';

const trackedEnv = [
  'MCPBASE_CONFIG',
  'MCPBASE_SERVER_NAME',
  'MCPBASE_SERVER_VERSION',
  'MCPBASE_LOG_LEVEL',
  'MCPBASE_LOGGING_TIMESTAMP',
  'MCPBASE_ALLOWED_COMMANDS',
  'MYAPP_CONFIG',
  'MYAPP_SERVER_NAME',
  'MYAPP_SERVER_VERSION',
  'MYAPP_LOG_LEVEL',
  'MYAPP_LOGGING_TIMESTAMP',
  'MYAPP_ALLOWED_COMMANDS',
  'CUSTOM_SERVER_INFO_ENABLED',
  'CUSTOM_STORAGE_BUCKET',
] as const;

const envSnapshot = Object.fromEntries(trackedEnv.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of trackedEnv) {
    const original = envSnapshot[key];
    if (original === undefined) {
      delete process.env[key];
      continue;
    }

    process.env[key] = original;
  }
});

describe('loadConfig', () => {
  it('varsayilan katman olarak baseDefaultConfig kullanir', async () => {
    delete process.env.MCPBASE_SERVER_NAME;
    delete process.env.MCPBASE_SERVER_VERSION;
    delete process.env.MCPBASE_LOG_LEVEL;
    delete process.env.MCPBASE_LOGGING_TIMESTAMP;

    const schema = createRuntimeConfigSchema(z.object({}));
    const result = await loadConfig(schema, { argv: [] });

    expect(result.server.name).toBe('mcpbase');
    expect(result.server.version).toBe('0.1.0');
    expect(result.logging.level).toBe('info');
    expect(result.logging.includeTimestamp).toBe(true);
  });

  it('defaults parametresi ile ozel varsayilan katmani kullanir', async () => {
    const schema = createRuntimeConfigSchema(
      z.object({
        storage: z.object({
          bucket: z.string().min(1),
        }),
      }),
    );

    const result = await loadConfig(schema, {
      defaults: {
        server: { name: 'child-server' },
        storage: { bucket: 'child-bucket' },
      },
      argv: [],
    });

    expect(result.server.name).toBe('child-server');
    expect(result.server.version).toBe('0.1.0');
    expect(result.storage.bucket).toBe('child-bucket');
  });

  it('varsayilan dosya ortam ve cli onceligini mapper ile korur', async () => {
    const tempDir = await mkdtemp(path.join(tmpdir(), 'mcpbase-config-'));
    const configPath = path.join(tempDir, 'mcpbase.json');

    await writeFile(
      configPath,
      JSON.stringify({
        server: { name: 'file-server' },
        logging: { level: 'warn' },
        security: { commands: { allowed: ['git'] } },
      }),
      'utf8',
    );

    process.env.MCPBASE_SERVER_NAME = 'env-server';
    process.env.MCPBASE_LOG_LEVEL = 'error';
    process.env.MCPBASE_ALLOWED_COMMANDS = 'npm,node';

    const result = await loadConfig(runtimeConfigSchema, {
      defaults: defaultConfig,
      envMapper: (prefix) => ({
        security: {
          commands: {
            allowed: envList(envName(prefix, 'ALLOWED_COMMANDS')),
          },
        },
      }),
      argv: [
        '--config',
        configPath,
        '--server-name',
        'cli-server',
        '--log-level',
        'debug',
        '--allow-command=pnpm',
      ],
      cliMapper: (args) => ({
        security: {
          commands: {
            allowed: args
              .filter((arg) => arg.startsWith('--allow-command='))
              .map((arg) => arg.replace('--allow-command=', '')),
          },
        },
      }),
    });

    expect(result.server.name).toBe('cli-server');
    expect(result.logging.level).toBe('debug');
    expect(result.security.commands.allowed).toEqual(['pnpm']);
    expect(result.server.version).toBe('0.1.0');
  });

  it('throws when the config file does not exist', async () => {
    await expect(
      loadConfig(runtimeConfigSchema, { argv: ['--config', '/missing/file.json'] }),
    ).rejects.toThrow(/Configuration file not found/u);
  });

  it('ozel sema ve env on eki ile config yukler', async () => {
    const storageSchema = z.object({
      storage: z.object({
        bucket: z.string().min(1),
      }),
    });
    const schema = createRuntimeConfigSchema(storageSchema);
    const tempDir = await mkdtemp(path.join(tmpdir(), 'mcpbase-config-'));
    const configPath = path.join(tempDir, 'myapp.config.json');

    await writeFile(
      configPath,
      JSON.stringify({
        server: { name: 'dosya-sunucusu' },
        logging: { level: 'warn' },
        storage: { bucket: 'arsiv' },
      }),
      'utf8',
    );

    process.env.MYAPP_SERVER_NAME = 'ortam-sunucusu';
    process.env.MYAPP_LOG_LEVEL = 'error';

    const result = await loadConfig(schema, {
      envPrefix: 'MYAPP_',
      defaultConfigFile: configPath,
      argv: ['--server-name', 'cli-sunucusu', '--log-level', 'debug'],
    });

    expect(result.server.name).toBe('cli-sunucusu');
    expect(result.logging.level).toBe('debug');
    expect(result.logging.includeTimestamp).toBe(true);
    expect(result.server.version).toBe('0.1.0');
    expect(result.storage.bucket).toBe('arsiv');
  });

  it('envMapper ile ozel ortam degiskeni parse edilebilir', async () => {
    process.env.CUSTOM_SERVER_INFO_ENABLED = 'true';
    process.env.CUSTOM_STORAGE_BUCKET = 'custom-bucket';

    const schema = createRuntimeConfigSchema(
      z.object({
        storage: z.object({ bucket: z.string() }),
        features: z.object({ serverInfo: z.boolean() }),
      }),
    );

    const result = await loadConfig(schema, {
      envPrefix: 'CUSTOM_',
      envMapper: (prefix) => ({
        storage: {
          bucket: process.env[envName(prefix, 'STORAGE_BUCKET')],
        },
        features: {
          serverInfo: envBoolean(envName(prefix, 'SERVER_INFO_ENABLED')),
        },
      }),
      argv: [],
    });

    expect(result.storage.bucket).toBe('custom-bucket');
    expect(result.features.serverInfo).toBe(true);
  });

  it('envMapper sonucu base env verileriyle merge olur', async () => {
    process.env.MYAPP_SERVER_NAME = 'mapped-server';
    process.env.MYAPP_CUSTOM_FLAG = 'true';

    const schema = createRuntimeConfigSchema(
      z.object({
        custom: z.object({ flag: z.boolean() }),
      }),
    );

    const result = await loadConfig(schema, {
      envPrefix: 'MYAPP_',
      envMapper: (prefix) => ({
        custom: {
          flag: envBoolean(envName(prefix, 'CUSTOM_FLAG')),
        },
      }),
      argv: [],
    });

    expect(result.server.name).toBe('mapped-server');
    expect(result.custom.flag).toBe(true);
  });

  it('cliMapper ile ozel CLI argumanlari parse edilebilir', async () => {
    const schema = createRuntimeConfigSchema(
      z.object({
        storage: z.object({ bucket: z.string() }),
      }),
    );

    const result = await loadConfig(schema, {
      argv: ['--storage-bucket', 'my-bucket'],
      cliMapper: (args) => {
        const bucketIndex = args.indexOf('--storage-bucket');
        if (bucketIndex !== -1 && args[bucketIndex + 1]) {
          return { storage: { bucket: args[bucketIndex + 1] } };
        }
        return {};
      },
    });

    expect(result.storage.bucket).toBe('my-bucket');
  });

  it('envName envBoolean envList export edilir', () => {
    expect(typeof envName).toBe('function');
    expect(typeof envBoolean).toBe('function');
    expect(typeof envList).toBe('function');
  });
});
