import type { BaseToolExecutionContext } from '../core/execution-context.js';
import { AppError } from '../core/app-error.js';
import type {
  ToolDefinition,
  ToolInputSchema,
  ToolOutputSchema,
} from '../contracts/tool-contract.js';

export class ToolRegistry<TContext extends BaseToolExecutionContext = BaseToolExecutionContext> {
  private readonly tools = new Map<
    string,
    ToolDefinition<ToolInputSchema, ToolOutputSchema | undefined, TContext>
  >();

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

    return tool;
  }

  public list(): ToolDefinition<ToolInputSchema, ToolOutputSchema | undefined, TContext>[] {
    return [...this.tools.values()];
  }
}
