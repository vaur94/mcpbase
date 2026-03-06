import { z } from 'zod';

import { createTextContent } from '../core/result.js';
import type { ToolDefinition } from '../contracts/tool-contract.js';

export function createExampleTools(): ToolDefinition[] {
  const serverInfoInputSchema = z.object({});
  const serverInfoOutputSchema = z.object({
    name: z.string(),
    version: z.string(),
    enabledFeatures: z.array(z.string()),
  });

  const serverInfoTool: ToolDefinition<
    typeof serverInfoInputSchema,
    typeof serverInfoOutputSchema
  > = {
    name: 'server_info',
    title: 'Sunucu Bilgisi',
    description: 'Calisan MCP tabaninin etkin ayar ozeti ile surum bilgisini dondurur.',
    inputSchema: serverInfoInputSchema,
    outputSchema: serverInfoOutputSchema,
    security: {
      requiredFeature: 'serverInfoTool',
    },
    async execute(_input, context) {
      const enabledFeatures = Object.entries(context.config.security.features)
        .filter(([, enabled]) => enabled)
        .map(([feature]) => feature);

      return {
        content: [
          createTextContent(
            `${context.config.server.name} ${context.config.server.version} hazir. Etkin ozellikler: ${enabledFeatures.join(', ') || 'yok'}.`,
          ),
        ],
        structuredContent: {
          name: context.config.server.name,
          version: context.config.server.version,
          enabledFeatures,
        },
      };
    },
  };

  const textTransformInputSchema = z.object({
    text: z.string().min(1).max(5000),
    mode: z.enum(['uppercase', 'lowercase', 'reverse', 'trim']),
  });
  const textTransformOutputSchema = z.object({
    transformedText: z.string(),
    mode: z.enum(['uppercase', 'lowercase', 'reverse', 'trim']),
  });

  const textTransformTool: ToolDefinition<
    typeof textTransformInputSchema,
    typeof textTransformOutputSchema
  > = {
    name: 'text_transform',
    title: 'Metin Donusturucu',
    description: 'Guvenli ve saf bir referans arac olarak verilen metni donusturur.',
    inputSchema: textTransformInputSchema,
    outputSchema: textTransformOutputSchema,
    security: {
      requiredFeature: 'textTransformTool',
    },
    async execute(input) {
      const transformedText = (() => {
        switch (input.mode) {
          case 'uppercase':
            return input.text.toUpperCase();
          case 'lowercase':
            return input.text.toLowerCase();
          case 'reverse':
            return [...input.text].reverse().join('');
          case 'trim':
            return input.text.trim();
        }
      })();

      return {
        content: [createTextContent(transformedText)],
        structuredContent: {
          transformedText,
          mode: input.mode,
        },
      };
    },
  };

  return [serverInfoTool, textTransformTool];
}
