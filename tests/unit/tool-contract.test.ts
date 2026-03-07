import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import type { BaseRuntimeConfig } from '../../src/contracts/runtime-config.js';
import type {
  ToolAnnotations,
  ToolDefinition,
  ToolInputSchema,
  ToolOutputSchema,
  ToolSecurityDefinition,
  ToolSuccessPayload,
} from '../../src/contracts/tool-contract.js';
import type {
  BaseToolExecutionContext,
  ToolExecutionContext,
} from '../../src/core/execution-context.js';

describe('ToolDefinition', () => {
  describe('genel tip parametreleri', () => {
    it('varsayilan TContext ile calisir', () => {
      const InputSchema = z.object({ name: z.string() });
      const OutputSchema = z.object({ greeting: z.string() });

      const tool: ToolDefinition<typeof InputSchema, typeof OutputSchema> = {
        name: 'test_tool',
        title: 'Test Tool',
        description: 'Test araci',
        inputSchema: InputSchema,
        outputSchema: OutputSchema,
        async execute(input, _context) {
          return {
            content: [{ type: 'text', text: `Hello ${input.name}` }],
          };
        },
      };

      expect(tool.name).toBe('test_tool');
      expect(tool.execute).toBeDefined();
    });

    it('ozel TContext parametresi ile calisir', async () => {
      const InputSchema = z.object({ query: z.string() });

      type CustomConfig = BaseRuntimeConfig<{
        storage: { bucket: string };
      }>;
      type CustomContext = BaseToolExecutionContext<CustomConfig>;

      const tool: ToolDefinition<typeof InputSchema, undefined, CustomContext> = {
        name: 'custom_tool',
        title: 'Custom Tool',
        description: 'Ozel context araci',
        inputSchema: InputSchema,
        async execute(input, _context) {
          expect(context.config.storage.bucket).toBe('arsiv');
          return { content: [{ type: 'text', text: input.query }] };
        },
      };

      const context: CustomContext = {
        requestId: 'req-custom',
        toolName: 'custom_tool',
        config: {
          server: { name: 'test-server', version: '1.0.0' },
          logging: { level: 'info', includeTimestamp: false },
          storage: { bucket: 'arsiv' },
        },
      };

      expect(tool.name).toBe('custom_tool');
      await expect(tool.execute({ query: 'merhaba' }, context)).resolves.toMatchObject({
        content: [{ type: 'text', text: 'merhaba' }],
      });
    });

    it('TInput ve TOutput tiplerini dogru cikarir', () => {
      const InputSchema = z.object({ text: z.string() });
      const OutputSchema = z.object({ result: z.string() });

      const tool: ToolDefinition<typeof InputSchema, typeof OutputSchema> = {
        name: 'typed_tool',
        title: 'Typed Tool',
        description: 'Tipi test edilen arac',
        inputSchema: InputSchema,
        outputSchema: OutputSchema,
        async execute(input, _context) {
          return {
            content: [{ type: 'text', text: input.text }],
            structuredContent: { result: input.text },
          };
        },
      };

      // Zod infers types correctly at compile time
      expect(tool.inputSchema).toBe(InputSchema);
      expect(tool.outputSchema).toBe(OutputSchema);
    });
  });

  describe('execute metodu', () => {
    it('ToolExecutionContext ile calisan execute metodu', async () => {
      const InputSchema = z.object({ value: z.number() });
      const mockContext: ToolExecutionContext = {
        requestId: 'req-123',
        toolName: 'test_tool',
        config: {
          server: { name: 'test-server', version: '1.0.0' },
          logging: { level: 'info', includeTimestamp: false },
          security: {
            features: { serverInfoTool: true, textTransformTool: true },
            commands: { allowed: [] },
            paths: { allowed: [] },
          },
        },
      };

      const tool: ToolDefinition<typeof InputSchema, undefined> = {
        name: 'test_tool',
        title: 'Test Tool',
        description: 'Test',
        inputSchema: InputSchema,
        async execute(input, _context) {
          return {
            content: [{ type: 'text', text: String(input.value * 2) }],
          };
        },
      };

      const result = await tool.execute({ value: 21 }, mockContext);
      expect(result.content[0]?.text).toBe('42');
    });
  });

  describe('guvenlik tanimi', () => {
    it('ToolSecurityDefinition ile calisir', () => {
      const securityDef: ToolSecurityDefinition = {
        requiredFeature: 'serverInfoTool',
      };

      const InputSchema = z.object({});
      const tool: ToolDefinition<typeof InputSchema, undefined> = {
        name: 'secure_tool',
        title: 'Secure Tool',
        description: 'Guvenli arac',
        inputSchema: InputSchema,
        security: securityDef,
        async execute(input, context) {
          return { content: [{ type: 'text', text: 'ok' }] };
        },
      };

      expect(tool.security?.requiredFeature).toBe('serverInfoTool');
    });

    it('guvenlik opsiyonel olabilir', () => {
      const InputSchema = z.object({});
      const tool: ToolDefinition<typeof InputSchema, undefined> = {
        name: 'open_tool',
        title: 'Open Tool',
        description: 'Acik arac',
        inputSchema: InputSchema,
        async execute(input, context) {
          return { content: [{ type: 'text', text: 'ok' }] };
        },
      };

      expect(tool.security).toBeUndefined();
    });
  });
});

describe('ToolAnnotations', () => {
  it('tum annotation alanlari ile olusturulabilir', () => {
    const annotations: ToolAnnotations = {
      title: 'Custom Title',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    };

    expect(annotations.title).toBe('Custom Title');
    expect(annotations.readOnlyHint).toBe(true);
    expect(annotations.idempotentHint).toBe(true);
  });

  it('minimum annotation ile olusturulabilir', () => {
    const annotations: ToolAnnotations = {};

    expect(annotations.title).toBeUndefined();
    expect(annotations.readOnlyHint).toBeUndefined();
  });

  it('title disindaki alanlar opsiyonel', () => {
    const annotations: ToolAnnotations = {
      title: 'Sadece Baslik',
    };

    expect(annotations.title).toBe('Sadece Baslik');
    expect(annotations.destructiveHint).toBeUndefined();
  });
});

describe('ToolSuccessPayload', () => {
  it('icerik ve structuredContent ile olusturulabilir', () => {
    const payload: ToolSuccessPayload = {
      content: [{ type: 'text', text: 'test output' }],
      structuredContent: { extra: 'data' },
    };

    expect(payload.content).toHaveLength(1);
    expect(payload.content[0]?.text).toBe('test output');
    expect(payload.structuredContent?.extra).toBe('data');
  });

  it('sadece icerik ile olusturulabilir', () => {
    const payload: ToolSuccessPayload = {
      content: [{ type: 'text', text: 'simple output' }],
    };

    expect(payload.content).toHaveLength(1);
    expect(payload.structuredContent).toBeUndefined();
  });
});

describe('ToolInputSchema ve ToolOutputSchema tipleri', () => {
  it('ToolInputSchema ZodObject olarak tanimli', () => {
    const schema: ToolInputSchema = z.object({ name: z.string() });
    expect(schema).toBeDefined();
  });

  it('ToolOutputSchema ZodObject olarak tanimli', () => {
    const schema: ToolOutputSchema = z.object({ result: z.string() });
    expect(schema).toBeDefined();
  });
});
