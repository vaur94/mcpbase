import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  baseLoggingSchema,
  baseRuntimeConfigSchema,
  baseServerSchema,
  createPartialRuntimeConfigSchema,
  createRuntimeConfigSchema,
  logLevelSchema,
  partialRuntimeConfigSchema,
  runtimeConfigSchema,
} from '../../src/contracts/runtime-config.js';
import type { BaseRuntimeConfig, RuntimeConfig } from '../../src/contracts/runtime-config.js';

describe('logLevelSchema', () => {
  it('tüm geçerli log seviyelerini kabul eder', () => {
    for (const level of ['debug', 'info', 'warn', 'error']) {
      expect(logLevelSchema.parse(level)).toBe(level);
    }
  });

  it('geçersiz log seviyesini reddeder', () => {
    expect(() => logLevelSchema.parse('trace')).toThrow();
  });
});

describe('baseServerSchema', () => {
  it('geçerli server yapılandırmasını doğrular', () => {
    const valid = { name: 'my-server', version: '2.0.0' };
    expect(baseServerSchema.parse(valid)).toEqual(valid);
  });

  it('boş name alanında hata verir', () => {
    expect(() => baseServerSchema.parse({ name: '', version: '1.0.0' })).toThrow();
  });

  it('boş version alanında hata verir', () => {
    expect(() => baseServerSchema.parse({ name: 'test', version: '' })).toThrow();
  });
});

describe('baseLoggingSchema', () => {
  it('geçerli logging yapılandırmasını doğrular', () => {
    const valid = { level: 'warn', includeTimestamp: false };
    expect(baseLoggingSchema.parse(valid)).toEqual(valid);
  });

  it('geçersiz log seviyesinde hata verir', () => {
    expect(() => baseLoggingSchema.parse({ level: 'trace', includeTimestamp: true })).toThrow();
  });
});

describe('baseRuntimeConfigSchema', () => {
  it('yalnızca server ve logging alanlarını doğrular', () => {
    const valid = {
      server: { name: 'test', version: '1.0.0' },
      logging: { level: 'info', includeTimestamp: true },
    };
    const result = baseRuntimeConfigSchema.parse(valid);
    expect(result).toEqual(valid);
  });

  it('security alanı olmadan doğrulama başarılı olur', () => {
    const valid = {
      server: { name: 'test', version: '1.0.0' },
      logging: { level: 'debug', includeTimestamp: false },
    };
    expect(() => baseRuntimeConfigSchema.parse(valid)).not.toThrow();
  });

  it('eksik server alanında hata verir', () => {
    const invalid = {
      logging: { level: 'info', includeTimestamp: true },
    };
    expect(() => baseRuntimeConfigSchema.parse(invalid)).toThrow();
  });

  it('eksik logging alanında hata verir', () => {
    const invalid = {
      server: { name: 'test', version: '1.0.0' },
    };
    expect(() => baseRuntimeConfigSchema.parse(invalid)).toThrow();
  });

  it('security alanı içeren veriyi yine de kabul eder (strip edilir)', () => {
    const withSecurity = {
      server: { name: 'test', version: '1.0.0' },
      logging: { level: 'info', includeTimestamp: true },
      security: { features: {} },
    };
    const result = baseRuntimeConfigSchema.parse(withSecurity);
    expect(result).toEqual({
      server: { name: 'test', version: '1.0.0' },
      logging: { level: 'info', includeTimestamp: true },
    });
  });
});

describe('createRuntimeConfigSchema', () => {
  it('base schema ile extension schema birleştirir', () => {
    const storageExt = z.object({
      storage: z.object({ path: z.string() }),
    });
    const schema = createRuntimeConfigSchema(storageExt);
    const valid = {
      server: { name: 'test', version: '1.0.0' },
      logging: { level: 'info', includeTimestamp: true },
      storage: { path: '/data' },
    };
    expect(schema.parse(valid)).toEqual(valid);
  });

  it('extension alanı eksik olduğunda hata verir', () => {
    const storageExt = z.object({
      storage: z.object({ path: z.string() }),
    });
    const schema = createRuntimeConfigSchema(storageExt);
    const invalid = {
      server: { name: 'test', version: '1.0.0' },
      logging: { level: 'info', includeTimestamp: true },
    };
    expect(() => schema.parse(invalid)).toThrow();
  });

  it('birden fazla extension alanı ile çalışır', () => {
    const extSchema = z.object({
      storage: z.object({ path: z.string() }),
      cache: z.object({ ttl: z.number() }),
    });
    const schema = createRuntimeConfigSchema(extSchema);
    const valid = {
      server: { name: 'test', version: '1.0.0' },
      logging: { level: 'info', includeTimestamp: true },
      storage: { path: '/data' },
      cache: { ttl: 3600 },
    };
    expect(schema.parse(valid)).toEqual(valid);
  });

  it('base alanları yanlışsa extension doğru olsa bile hata verir', () => {
    const extSchema = z.object({
      storage: z.object({ path: z.string() }),
    });
    const schema = createRuntimeConfigSchema(extSchema);
    const invalid = {
      server: { name: '', version: '1.0.0' },
      logging: { level: 'info', includeTimestamp: true },
      storage: { path: '/data' },
    };
    expect(() => schema.parse(invalid)).toThrow();
  });
});

describe('createPartialRuntimeConfigSchema', () => {
  it('boş obje kabul eder', () => {
    const extSchema = z.object({
      storage: z.object({ path: z.string() }),
    });
    const schema = createPartialRuntimeConfigSchema(extSchema);
    expect(schema.parse({})).toEqual({});
  });

  it('kısmi server verisi kabul eder', () => {
    const extSchema = z.object({
      storage: z.object({ path: z.string() }),
    });
    const schema = createPartialRuntimeConfigSchema(extSchema);
    const partial = { server: { name: 'test' } };
    const result = schema.parse(partial);
    expect(result).toMatchObject({ server: { name: 'test' } });
  });

  it('iç içe kısmi extension verisi kabul eder', () => {
    const extSchema = z.object({
      storage: z.object({ path: z.string(), maxSize: z.number() }),
    });
    const schema = createPartialRuntimeConfigSchema(extSchema);
    const partial = { storage: { path: '/data' } };
    const result = schema.parse(partial);
    expect(result).toMatchObject({ storage: { path: '/data' } });
  });

  it('yalnızca extension verisi kabul eder', () => {
    const extSchema = z.object({
      storage: z.object({ path: z.string() }),
    });
    const schema = createPartialRuntimeConfigSchema(extSchema);
    const partial = { storage: { path: '/data' } };
    expect(() => schema.parse(partial)).not.toThrow();
  });
});

describe('geriye uyumluluk', () => {
  it('runtimeConfigSchema security dahil doğrular', () => {
    const valid = {
      server: { name: 'test', version: '1.0.0' },
      logging: { level: 'info', includeTimestamp: true },
      security: {
        features: { serverInfoTool: true, textTransformTool: false },
        commands: { allowed: ['git'] },
        paths: { allowed: ['/home'] },
      },
    };
    expect(runtimeConfigSchema.parse(valid)).toEqual(valid);
  });

  it('runtimeConfigSchema security eksikse hata verir', () => {
    const invalid = {
      server: { name: 'test', version: '1.0.0' },
      logging: { level: 'info', includeTimestamp: true },
    };
    expect(() => runtimeConfigSchema.parse(invalid)).toThrow();
  });

  it('partialRuntimeConfigSchema kısmi security kabul eder', () => {
    const partial = {
      security: {
        features: { serverInfoTool: false },
      },
    };
    expect(() => partialRuntimeConfigSchema.parse(partial)).not.toThrow();
  });

  it('partialRuntimeConfigSchema boş obje kabul eder', () => {
    expect(() => partialRuntimeConfigSchema.parse({})).not.toThrow();
  });
});

describe('BaseRuntimeConfig tipi', () => {
  it('varsayılan tip parametresi ile derlenir', () => {
    const config: BaseRuntimeConfig = {
      server: { name: 'test', version: '1.0.0' },
      logging: { level: 'info', includeTimestamp: true },
    };
    expect(config.server.name).toBe('test');
  });

  it('extension tipi ile derlenir', () => {
    const config: BaseRuntimeConfig<{ storage: { path: string } }> = {
      server: { name: 'test', version: '1.0.0' },
      logging: { level: 'info', includeTimestamp: true },
      storage: { path: '/data' },
    };
    expect(config.storage.path).toBe('/data');
  });

  it('RuntimeConfig tipi geriye uyumlu kalır', () => {
    const config: RuntimeConfig = {
      server: { name: 'test', version: '1.0.0' },
      logging: { level: 'info', includeTimestamp: true },
      security: {
        features: { serverInfoTool: true, textTransformTool: true },
        commands: { allowed: [] },
        paths: { allowed: [] },
      },
    };
    expect(config.security.features.serverInfoTool).toBe(true);
  });
});
