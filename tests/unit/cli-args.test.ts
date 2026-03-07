import { describe, expect, it } from 'vitest';

import { parseCliArgs } from '../../src/infrastructure/cli-args.js';

describe('parseCliArgs', () => {
  it('reads base override fields', () => {
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
    ]);

    expect(result.configPath).toBe('config.json');
    expect(result.overrides).toEqual({
      server: { name: 'demo', version: '2.0.0' },
      logging: { level: 'debug', includeTimestamp: false },
    });
  });

  it('cliMapper ile ozel argumanlar parse edilebilir', () => {
    const result = parseCliArgs(['--custom-flag', 'value'], (args) => {
      const idx = args.indexOf('--custom-flag');
      if (idx !== -1 && args[idx + 1]) {
        return { custom: { flag: args[idx + 1] } };
      }
      return {};
    });

    expect(result.overrides).toEqual({ custom: { flag: 'value' } });
  });

  it('cliMapper sonucu base override verileriyle merge olur', () => {
    const result = parseCliArgs(['--server-name', 'demo', '--custom-flag', 'value'], (args) => {
      const idx = args.indexOf('--custom-flag');
      if (idx !== -1 && args[idx + 1]) {
        return { custom: { flag: args[idx + 1] } };
      }
      return {};
    });

    expect(result.overrides).toEqual({
      server: { name: 'demo' },
      custom: { flag: 'value' },
    });
  });

  it('cliMapper bilinmeyen argumanlari atmaz', () => {
    expect(() => parseCliArgs(['--unknown'], () => ({}))).toThrow(/Unknown argument/u);
  });

  it('eski security argumanlarini artik kabul etmez', () => {
    expect(() => parseCliArgs(['--enable-server-info-tool'])).toThrow(/Unknown argument/u);
    expect(() => parseCliArgs(['--allow-command=git'])).toThrow(/Unknown argument/u);
    expect(() => parseCliArgs(['--allow-path=/tmp'])).toThrow(/Unknown argument/u);
  });

  it('rejects an unknown argument', () => {
    expect(() => parseCliArgs(['--unknown'])).toThrow(/Unknown argument/u);
  });

  it('throws when a required value is missing', () => {
    expect(() => parseCliArgs(['--config'])).toThrow(/expects a value/u);
  });
});
