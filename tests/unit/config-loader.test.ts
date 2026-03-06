import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { loadConfig } from '../../src/config/load-config.js';

const trackedEnv = [
  'MCPBASE_CONFIG',
  'MCPBASE_SERVER_NAME',
  'MCPBASE_SERVER_VERSION',
  'MCPBASE_LOG_LEVEL',
  'MCPBASE_LOGGING_TIMESTAMP',
  'MCPBASE_SERVER_INFO_TOOL_ENABLED',
  'MCPBASE_TEXT_TRANSFORM_TOOL_ENABLED',
  'MCPBASE_ALLOWED_COMMANDS',
  'MCPBASE_ALLOWED_PATHS',
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
  it('varsayilan, dosya, env ve CLI onceligini uygular', async () => {
    const tempDir = await mkdtemp(path.join(tmpdir(), 'mcpbase-config-'));
    const configPath = path.join(tempDir, 'mcpbase.json');

    await writeFile(
      configPath,
      JSON.stringify({
        server: { name: 'dosya-sunucusu' },
        logging: { level: 'warn' },
        security: { commands: { allowed: ['git'] } },
      }),
      'utf8',
    );

    process.env.MCPBASE_SERVER_NAME = 'env-sunucusu';
    process.env.MCPBASE_LOG_LEVEL = 'error';
    process.env.MCPBASE_ALLOWED_COMMANDS = 'npm,node';

    const result = await loadConfig([
      '--config',
      configPath,
      '--server-name',
      'cli-sunucusu',
      '--log-level',
      'debug',
      '--allow-command=pnpm',
    ]);

    expect(result.server.name).toBe('cli-sunucusu');
    expect(result.logging.level).toBe('debug');
    expect(result.security.commands.allowed).toEqual(['pnpm']);
    expect(result.server.version).toBe('0.1.0');
  });

  it('olmayan config dosyasinda hata verir', async () => {
    await expect(loadConfig(['--config', '/olmayan/dosya.json'])).rejects.toThrow(
      /Konfigurasyon dosyasi bulunamadi/u,
    );
  });
});
