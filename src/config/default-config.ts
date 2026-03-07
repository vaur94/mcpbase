import type { BaseRuntimeConfig, RuntimeConfig } from '../contracts/runtime-config.js';

export const baseDefaultConfig: BaseRuntimeConfig = {
  server: {
    name: 'mcpbase',
    version: '0.1.0',
  },
  logging: {
    level: 'info',
    includeTimestamp: true,
  },
};

export const defaultConfig: RuntimeConfig = {
  ...baseDefaultConfig,
  security: {
    features: {
      serverInfoTool: true,
      textTransformTool: true,
    },
    commands: {
      allowed: [],
    },
    paths: {
      allowed: [],
    },
  },
};
