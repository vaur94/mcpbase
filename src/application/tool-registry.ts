import type { BaseToolExecutionContext } from '../core/execution-context.js';
import { AppError } from '../core/app-error.js';
import type { ToolStateManager } from '../hub/tool-state.js';
import type {
  ToolDefinition,
  ToolInputSchema,
  ToolOutputSchema,
} from '../contracts/tool-contract.js';

interface ToolRegistryOptions {
  readonly stateManager?: ToolStateManager;
}

export class ToolRegistry<TContext extends BaseToolExecutionContext = BaseToolExecutionContext> {
  private readonly tools = new Map<
    string,
    ToolDefinition<ToolInputSchema, ToolOutputSchema | undefined, TContext>
  >();
  private readonly stateManager: ToolStateManager | undefined;

  public constructor(options?: ToolRegistryOptions) {
    this.stateManager = options?.stateManager;
  }

  public getStateManager(): ToolStateManager | undefined {
    return this.stateManager;
  }

  public register(
    tool: ToolDefinition<ToolInputSchema, ToolOutputSchema | undefined, TContext>,
  ): void {
    if (this.tools.has(tool.name)) {
      throw new AppError('CONFIG_ERROR', `Duplicate tool registration for name: ${tool.name}`);
    }

    this.tools.set(tool.name, tool);
  }

  public get(
    name: string,
  ): ToolDefinition<ToolInputSchema, ToolOutputSchema | undefined, TContext> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new AppError('TOOL_NOT_FOUND', `Tool not found: ${name}`);
    }

    if (this.stateManager && !this.stateManager.isCallable(name)) {
      const state = this.stateManager.getState(name);
      if (state === 'hidden') {
        throw new AppError('TOOL_NOT_FOUND', `Tool ${name} not found`);
      }

      throw new AppError('TOOL_EXECUTION_ERROR', `Tool ${name} is currently disabled`);
    }

    return tool;
  }

  public has(name: string): boolean {
    return this.tools.has(name);
  }

  public tryGet(
    name: string,
  ): ToolDefinition<ToolInputSchema, ToolOutputSchema | undefined, TContext> | undefined {
    return this.tools.get(name);
  }

  public list(): ToolDefinition<ToolInputSchema, ToolOutputSchema | undefined, TContext>[] {
    if (!this.stateManager) {
      return [...this.tools.values()];
    }

    const stateManager = this.stateManager;

    return [...this.tools.values()].filter((tool) => stateManager.isVisible(tool.name));
  }
}
