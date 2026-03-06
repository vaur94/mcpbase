import { describe, expect, it } from 'vitest';

import { parseCliArgs } from '../../src/infrastructure/cli-args.js';

describe('parseCliArgs', () => {
  it('desteklenen override alanlarini okur', () => {
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

  it('bilinmeyen argumani reddeder', () => {
    expect(() => parseCliArgs(['--bilinmeyen'])).toThrow(/Bilinmeyen arguman/u);
  });

  it('eksik deger durumunda hata verir', () => {
    expect(() => parseCliArgs(['--config'])).toThrow(/deger bekleniyor/u);
  });
});
