import type { RuntimeConfig } from '../contracts/runtime-config.js';

export const defaultConfig: RuntimeConfig = {
  server: {
    name: 'mcpbase',
    version: '0.1.0',
  },
  logging: {
    level: 'info',
    includeTimestamp: true,
  },
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
