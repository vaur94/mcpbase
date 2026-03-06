import { z } from 'zod';

import { createTextContent, type ToolDefinition } from '../src/index.js';

export const healthTool: ToolDefinition = {
  name: 'health_check',
  title: 'Saglik Kontrolu',
  description: 'mcpbase uzerinden turetilen sunucular icin basit referans arac.',
  inputSchema: z.object({
    service: z.string().min(1),
  }),
  outputSchema: z.object({
    service: z.string(),
    ok: z.boolean(),
  }),
  async execute(input) {
    return {
      content: [createTextContent(`${input.service} saglikli gorunuyor.`)],
      structuredContent: {
        service: input.service,
        ok: true,
      },
    };
  },
};
