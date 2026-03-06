import { describe, expect, it } from 'vitest';

import {
  assertAllowedCommand,
  assertAllowedPath,
  assertFeatureEnabled,
} from '../../src/security/guards.js';
import { createFixtureConfig } from '../fixtures/runtime-config.js';

describe('security guards', () => {
  it('aktif olmayan ozelligi reddeder', () => {
    const config = createFixtureConfig({
      security: {
        features: {
          serverInfoTool: false,
          textTransformTool: true,
        },
      },
    });

    expect(() => assertFeatureEnabled(config.security, 'serverInfoTool')).toThrow(
      /Ozellik kapali/u,
    );
  });

  it('izinli komutu kabul eder ve digerini reddeder', () => {
    const config = createFixtureConfig({
      security: {
        commands: {
          allowed: ['git'],
        },
      },
    });

    expect(() => assertAllowedCommand(config.security, 'git status')).not.toThrow();
    expect(() => assertAllowedCommand(config.security, 'npm test')).toThrow(/Komut izni yok/u);
  });

  it('izinli kok disindaki yollari reddeder', () => {
    const config = createFixtureConfig({
      security: {
        paths: {
          allowed: ['/tmp/mcpbase'],
        },
      },
    });

    expect(() => assertAllowedPath(config.security, '/tmp/mcpbase/child')).not.toThrow();
    expect(() => assertAllowedPath(config.security, '/etc/passwd')).toThrow(/Yol izni yok/u);
  });
});
