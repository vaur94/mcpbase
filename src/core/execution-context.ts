import type { BaseRuntimeConfig, RuntimeConfig } from '../contracts/runtime-config.js';

export interface BaseToolExecutionContext<TConfig extends BaseRuntimeConfig = BaseRuntimeConfig> {
  readonly requestId: string;
  readonly toolName: string;
  readonly config: TConfig;
}

export type ToolExecutionContext = BaseToolExecutionContext<RuntimeConfig>;
