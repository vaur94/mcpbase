import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PromptCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { z } from 'zod';

export interface PromptMessage {
  readonly role: 'user' | 'assistant';
  readonly content: { readonly type: 'text'; readonly text: string };
}

export interface PromptDefinition {
  readonly name: string;
  readonly description?: string;
  readonly messages: readonly PromptMessage[];
}

export interface PromptTemplateDefinition<TArgs extends z.ZodRawShape = z.ZodRawShape> {
  readonly name: string;
  readonly description?: string;
  readonly argsSchema: TArgs;
  readonly getMessages: (args: z.infer<z.ZodObject<TArgs>>) => PromptMessage[];
}

export function registerPrompts(server: McpServer, prompts: PromptDefinition[]): void {
  for (const prompt of prompts) {
    const cb: PromptCallback = () => ({ messages: [...prompt.messages] });

    if (prompt.description !== undefined) {
      server.prompt(prompt.name, prompt.description, cb);
    } else {
      server.prompt(prompt.name, cb);
    }
  }
}

export function registerPromptTemplates(
  server: McpServer,
  templates: PromptTemplateDefinition[],
): void {
  for (const template of templates) {
    if (template.description !== undefined) {
      server.prompt(template.name, template.description, template.argsSchema, (args, _extra) => ({
        messages: template.getMessages(args),
      }));
    } else {
      server.prompt(template.name, template.argsSchema, (args, _extra) => ({
        messages: template.getMessages(args),
      }));
    }
  }
}
