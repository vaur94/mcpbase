import { describe, expect, it } from 'vitest';

import { parseCliArgs } from '../../src/infrastructure/cli-args.js';

describe('parseCliArgs', () => {
  it('reads supported override fields', () => {
    const result = parseCliArgs([
      '--config',
      'config.json',
      '--server-name',
      'demo',
      '--server-version',
      '2.0.0',
      '--log-level',
      'debug',
      '--logging-timestamp',
      'false',
      '--enable-text-transform-tool',
      '--allow-command=git',
      '--allow-path=/tmp/demo',
    ]);

    expect(result.configPath).toBe('config.json');
    expect(result.overrides).toEqual({
      server: { name: 'demo', version: '2.0.0' },
      logging: { level: 'debug', includeTimestamp: false },
      security: {
        features: { textTransformTool: true },
        commands: { allowed: ['git'] },
        paths: { allowed: ['/tmp/demo'] },
      },
    });
  });

  it('rejects an unknown argument', () => {
    expect(() => parseCliArgs(['--unknown'])).toThrow(/Unknown argument/u);
  });

  it('throws when a required value is missing', () => {
    expect(() => parseCliArgs(['--config'])).toThrow(/expects a value/u);
  });
});
