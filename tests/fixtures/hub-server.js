import { z } from 'zod';

import { bootstrap, createTextContent } from '../../dist/index.js';
import { createToolStateManager } from '../../dist/hub/index.js';

const stateManager = createToolStateManager(['aktif_arac', 'pasif_arac', 'gizli_arac']);
stateManager.setState('pasif_arac', 'disabled', 'bakim');
stateManager.setState('gizli_arac', 'hidden', 'gizli-mod');

const tools = [
  {
    name: 'aktif_arac',
    title: 'Aktif arac',
    description: 'Hub protokol testi icin aktif arac.',
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
    inputSchema: z.object({}),
    async execute() {
      return {
        content: [createTextContent('aktif arac sonucu')],
        structuredContent: {
          durum: 'aktif',
        },
      };
    },
  },
  {
    name: 'pasif_arac',
    title: 'Pasif arac',
    description: 'Hub protokol testi icin disabled arac.',
    annotations: {
      readOnlyHint: true,
    },
    inputSchema: z.object({}),
    async execute() {
      return {
        content: [createTextContent('pasif arac sonucu')],
        structuredContent: {
          durum: 'pasif',
        },
      };
    },
  },
  {
    name: 'gizli_arac',
    title: 'Gizli arac',
    description: 'Hub protokol testi icin hidden arac.',
    annotations: {
      readOnlyHint: true,
    },
    inputSchema: z.object({}),
    async execute() {
      return {
        content: [createTextContent('gizli arac sonucu')],
        structuredContent: {
          durum: 'gizli',
        },
      };
    },
  },
];

await bootstrap({
  argv: [],
  tools,
  stateManager,
  introspection: {
    includeTelemetry: false,
  },
});
