import type { ExecutionHooks } from '../contracts/hooks.js';
import type {
  ToolDefinition,
  ToolInputSchema,
  ToolOutputSchema,
} from '../contracts/tool-contract.js';
import type { BaseToolExecutionContext } from '../core/execution-context.js';

import { assertFeatureEnabled, type SecurityConfig } from './guards.js';

export interface ToolSecurityDefinition {
  readonly requiredFeature?: string;
}

export interface SecureToolDefinition<
  TInput extends ToolInputSchema = ToolInputSchema,
  TOutput extends ToolOutputSchema | undefined = ToolOutputSchema | undefined,
  TContext extends BaseToolExecutionContext = BaseToolExecutionContext,
> extends ToolDefinition<TInput, TOutput, TContext> {
  readonly security?: ToolSecurityDefinition;
}

export function createSecurityEnforcementHook<
  TFeatures extends Record<string, boolean>,
  TContext extends BaseToolExecutionContext = BaseToolExecutionContext,
>(
  securityConfig: SecurityConfig<TFeatures>,
): NonNullable<ExecutionHooks<TContext>['beforeExecute']> {
  return (tool) => {
    const secureTool = tool as SecureToolDefinition<
      ToolInputSchema,
      ToolOutputSchema | undefined,
      TContext
    >;
    const requiredFeature = secureTool.security?.requiredFeature;

    if (requiredFeature !== undefined) {
      assertFeatureEnabled(securityConfig, requiredFeature as keyof TFeatures);
    }
  };
}
