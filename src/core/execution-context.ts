import type { RuntimeConfig } from '../contracts/runtime-config.js';

export interface ToolExecutionContext {
  readonly requestId: string;
  readonly toolName: string;
  readonly config: RuntimeConfig;
}
