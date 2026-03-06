import { describe, expect, it } from 'vitest';

import {
  assertAllowedCommand,
  assertAllowedPath,
  assertFeatureEnabled,
} from '../../src/security/guards.js';
import { createFixtureConfig } from '../fixtures/runtime-config.js';

describe('security guards', () => {
  it('rejects a disabled feature', () => {
    const config = createFixtureConfig({
      security: {
        features: {
          serverInfoTool: false,
          textTransformTool: true,
        },
      },
    });

    expect(() => assertFeatureEnabled(config.security, 'serverInfoTool')).toThrow(
      /Feature is disabled/u,
    );
  });

  it('accepts an allowed command and rejects other commands', () => {
    const config = createFixtureConfig({
      security: {
        commands: {
          allowed: ['git'],
        },
      },
    });

    expect(() => assertAllowedCommand(config.security, 'git status')).not.toThrow();
    expect(() => assertAllowedCommand(config.security, 'npm test')).toThrow(
      /Command is not allowed/u,
    );
  });

  it('rejects paths outside the allowed root', () => {
    const config = createFixtureConfig({
      security: {
        paths: {
          allowed: ['/tmp/mcpbase'],
        },
      },
    });

    expect(() => assertAllowedPath(config.security, '/tmp/mcpbase/child')).not.toThrow();
    expect(() => assertAllowedPath(config.security, '/etc/passwd')).toThrow(/Path is not allowed/u);
  });
});
