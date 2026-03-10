import { describe, expect, it } from 'vitest';

import {
  createHubManifest,
  createHubManifestFromBootstrap,
  hubManifestSchema,
} from '../../src/hub/manifest.js';

describe('merkez manifest sozlesmesi', () => {
  it('manifest fabrikasi gecerli girdiyi schema ile dondurur', () => {
    const manifest = createHubManifest({
      package: {
        name: '@ornek/sunucu',
        version: '1.2.3',
        description: 'Aciklama',
      },
      mcpbase: {
        version: '2.0.0',
        compatibility: '^2.0.0',
      },
      server: {
        name: 'ornek-sunucu',
        version: '1.2.3',
      },
      transports: ['stdio', 'streamable-http'],
      capabilities: {
        tools: true,
        resources: false,
        prompts: false,
        logging: false,
        sampling: false,
        roots: false,
      },
      launch: {
        command: 'node',
        args: ['./dist/index.js'],
        configFile: 'mcpbase.config.json',
        envPrefix: 'MCPBASE_',
      },
      settingsSchema: {
        version: '1.0',
        groups: [
          {
            key: 'server',
            label: 'Server',
            fields: [
              {
                key: 'server.name',
                type: 'string',
                required: true,
                label: 'Server Name',
              },
            ],
          },
        ],
      },
    });

    expect(manifest.settingsSchema?.version).toBe('1.0');
    expect(manifest.transports).toEqual(['stdio', 'streamable-http']);
  });

  it('settings schema opsiyonel oldugunda manifesti kabul eder', () => {
    const manifest = createHubManifest({
      package: {
        name: '@ornek/sunucu',
        version: '1.0.0',
      },
      mcpbase: {
        version: '2.0.0',
        compatibility: '^2.0.0',
      },
      server: {
        name: 'ornek',
        version: '1.0.0',
      },
      transports: ['stdio'],
      capabilities: {
        tools: true,
        resources: false,
        prompts: false,
        logging: false,
        sampling: false,
        roots: false,
      },
      launch: {
        command: 'node',
        args: ['./dist/index.js'],
        configFile: 'mcpbase.config.json',
        envPrefix: 'MCPBASE_',
      },
    });

    expect(manifest.settingsSchema).toBeUndefined();
  });

  it('bootstrap tabanli fabrikada bos tools icin capability degeri false olur', () => {
    const manifest = createHubManifestFromBootstrap(
      {
        package: {
          name: '@ornek/sunucu',
          version: '0.1.0',
        },
        tools: [],
      },
      {
        server: {
          name: 'ornek',
          version: '0.1.0',
        },
        logging: {
          level: 'info',
          includeTimestamp: true,
        },
      },
    );

    expect(manifest.capabilities.tools).toBe(false);
    expect(manifest.transports).toEqual(['stdio']);
    expect(manifest.launch.command).toBe('node');
  });

  it('schema gecersiz transport degerini reddeder', () => {
    expect(() =>
      hubManifestSchema.parse({
        package: {
          name: '@ornek/sunucu',
          version: '1.0.0',
        },
        mcpbase: {
          version: '2.0.0',
          compatibility: '^2.0.0',
        },
        server: {
          name: 'ornek',
          version: '1.0.0',
        },
        transports: ['http'],
        capabilities: {
          tools: true,
          resources: false,
          prompts: false,
          logging: false,
          sampling: false,
          roots: false,
        },
        launch: {
          command: 'node',
          args: ['./dist/index.js'],
          configFile: 'mcpbase.config.json',
          envPrefix: 'MCPBASE_',
        },
      }),
    ).toThrow();
  });
});
