import type {
  BaseRuntimeConfig,
  PartialRuntimeConfig,
  RuntimeConfig,
} from '../../src/contracts/runtime-config.js';
import { baseDefaultConfig, defaultConfig } from '../../src/config/default-config.js';
import { deepMerge } from '../../src/shared/merge.js';

export function createBaseFixtureConfig(
  overrides: Partial<BaseRuntimeConfig> = {},
): BaseRuntimeConfig {
  return deepMerge(baseDefaultConfig, overrides);
}

export function createFixtureConfig(overrides: PartialRuntimeConfig = {}): RuntimeConfig {
  return deepMerge(defaultConfig, overrides as Partial<RuntimeConfig>);
}
