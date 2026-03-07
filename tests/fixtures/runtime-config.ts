import { baseDefaultConfig, defaultConfig } from '../../src/config/default-config.js';
import type {
  BaseRuntimeConfig,
  PartialRuntimeConfig,
  PartialRuntimeConfigWithSecurity,
  RuntimeConfig,
} from '../../src/contracts/runtime-config.js';

export function createBaseFixtureConfig(overrides: PartialRuntimeConfig = {}): BaseRuntimeConfig {
  return {
    ...baseDefaultConfig,
    ...overrides,
    server: {
      ...baseDefaultConfig.server,
      ...overrides.server,
    },
    logging: {
      ...baseDefaultConfig.logging,
      ...overrides.logging,
    },
  };
}

export function createFixtureConfig(
  overrides: PartialRuntimeConfigWithSecurity = {},
): RuntimeConfig {
  return {
    ...defaultConfig,
    ...overrides,
    server: {
      ...defaultConfig.server,
      ...overrides.server,
    },
    logging: {
      ...defaultConfig.logging,
      ...overrides.logging,
    },
    security: {
      ...defaultConfig.security,
      ...overrides.security,
      features: {
        ...defaultConfig.security.features,
        ...overrides.security?.features,
      },
      commands: {
        ...defaultConfig.security.commands,
        ...overrides.security?.commands,
      },
      paths: {
        ...defaultConfig.security.paths,
        ...overrides.security?.paths,
      },
    },
  };
}
