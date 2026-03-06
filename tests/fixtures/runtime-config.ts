import type { PartialRuntimeConfig, RuntimeConfig } from '../../src/contracts/runtime-config.js';
import { defaultConfig } from '../../src/config/default-config.js';
import { deepMerge } from '../../src/shared/merge.js';

export function createFixtureConfig(overrides: PartialRuntimeConfig = {}): RuntimeConfig {
  return deepMerge(defaultConfig, overrides as Partial<RuntimeConfig>);
}
