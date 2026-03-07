import type { BaseToolExecutionContext } from '../core/execution-context.js';
import { AppError } from '../core/app-error.js';
import type { ToolDefinition } from '../contracts/tool-contract.js';

export class ToolRegistry<TContext extends BaseToolExecutionContext = BaseToolExecutionContext> {
  private readonly tools = new Map<string, ToolDefinition<any, any, TContext>>();

  public register(tool: ToolDefinition<any, any, any>): void {
    if (this.tools.has(tool.name)) {
      throw new AppError('CONFIG_ERROR', `Duplicate tool registration for name: ${tool.name}`);
    }

    this.tools.set(tool.name, tool as ToolDefinition<any, any, TContext>);
  }

  public get(name: string): ToolDefinition<any, any, TContext> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new AppError('TOOL_NOT_FOUND', `Tool not found: ${name}`);
    }

    return tool;
  }

  public list(): ToolDefinition<any, any, TContext>[] {
    return [...this.tools.values()];
  }
}
