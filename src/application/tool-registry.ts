import { AppError } from '../core/app-error.js';
import type { ToolDefinition } from '../contracts/tool-contract.js';

export class ToolRegistry {
  private readonly tools = new Map<string, ToolDefinition>();

  public register(tool: ToolDefinition): void {
    if (this.tools.has(tool.name)) {
      throw new AppError('CONFIG_ERROR', `Ayni isimle ikinci arac kaydi var: ${tool.name}`);
    }

    this.tools.set(tool.name, tool);
  }

  public get(name: string): ToolDefinition {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new AppError('TOOL_NOT_FOUND', `Arac bulunamadi: ${name}`);
    }

    return tool;
  }

  public list(): ToolDefinition[] {
    return [...this.tools.values()];
  }
}
