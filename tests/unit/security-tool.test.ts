import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import type { ExecutionHooks } from '../../src/contracts/hooks.js';
import type { ToolDefinition } from '../../src/contracts/tool-contract.js';
import type { BaseToolExecutionContext } from '../../src/core/execution-context.js';
import {
  createSecurityEnforcementHook,
  type SecureToolDefinition,
  type ToolSecurityDefinition,
} from '../../src/security/tool-security.js';

const inputSchema = z.object({ value: z.string() });

describe('tool security', () => {
  it('SecureToolDefinition, ToolDefinition sozlesmesini genisletir', async () => {
    const security: ToolSecurityDefinition = {
      requiredFeature: 'serverInfoTool',
    };

    const tool: SecureToolDefinition<typeof inputSchema, undefined, BaseToolExecutionContext> = {
      name: 'secure_tool',
      title: 'Secure Tool',
      description: 'Guvenlik metadata tasiyan arac',
      inputSchema,
      security,
      async execute(input) {
        return {
          content: [{ type: 'text', text: input.value }],
        };
      },
    };

    const baseTool: ToolDefinition<typeof inputSchema, undefined, BaseToolExecutionContext> = tool;
    const result = await baseTool.execute(
      { value: 'merhaba' },
      {
        requestId: 'req-1',
        toolName: 'secure_tool',
        config: {
          server: { name: 'mcpbase', version: '0.1.0' },
          logging: { level: 'info', includeTimestamp: false },
        },
      },
    );

    expect(baseTool.name).toBe('secure_tool');
    expect(result.content[0]?.text).toBe('merhaba');
  });

  it('createSecurityEnforcementHook devre disi ozellik icin PERMISSION_DENIED firlatir', () => {
    const hook = createSecurityEnforcementHook({
      features: {
        serverInfoTool: false,
        textTransformTool: true,
      },
      commands: { allowed: [] },
      paths: { allowed: [] },
    });

    const tool: SecureToolDefinition<typeof inputSchema, undefined, BaseToolExecutionContext> = {
      name: 'secure_tool',
      title: 'Secure Tool',
      description: 'Guvenli arac',
      inputSchema,
      security: {
        requiredFeature: 'serverInfoTool',
      },
      async execute() {
        return { content: [{ type: 'text', text: 'ok' }] };
      },
    };

    expect(() =>
      hook(
        tool,
        { value: 'x' },
        {
          requestId: 'req-2',
          toolName: 'secure_tool',
          config: {
            server: { name: 'mcpbase', version: '0.1.0' },
            logging: { level: 'info', includeTimestamp: false },
          },
        },
      ),
    ).toThrow(/PERMISSION_DENIED|Feature is disabled/u);
  });

  it('createSecurityEnforcementHook etkin ozellikte gecis verir', () => {
    const hook: NonNullable<ExecutionHooks<BaseToolExecutionContext>['beforeExecute']> =
      createSecurityEnforcementHook({
        features: {
          serverInfoTool: true,
          textTransformTool: true,
        },
        commands: { allowed: [] },
        paths: { allowed: [] },
      });

    const tool: SecureToolDefinition<typeof inputSchema, undefined, BaseToolExecutionContext> = {
      name: 'secure_tool',
      title: 'Secure Tool',
      description: 'Guvenli arac',
      inputSchema,
      security: {
        requiredFeature: 'serverInfoTool',
      },
      async execute() {
        return { content: [{ type: 'text', text: 'ok' }] };
      },
    };

    expect(() =>
      hook(
        tool,
        { value: 'x' },
        {
          requestId: 'req-3',
          toolName: 'secure_tool',
          config: {
            server: { name: 'mcpbase', version: '0.1.0' },
            logging: { level: 'info', includeTimestamp: false },
          },
        },
      ),
    ).not.toThrow();
  });
});
