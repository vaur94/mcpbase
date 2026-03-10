import * as path from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { afterEach, describe, expect, it } from 'vitest';
import { z } from 'zod';

const clients: Client[] = [];

function createClient(): Client {
  const client = new Client({ name: 'mcpbase-hub-test-client', version: '1.0.0' });
  clients.push(client);
  return client;
}

function createTransport(): StdioClientTransport {
  return new StdioClientTransport({
    command: process.execPath,
    args: [path.resolve(process.cwd(), 'tests/fixtures/hub-server.js')],
  });
}

afterEach(async () => {
  await Promise.all(clients.splice(0).map(async (client) => client.close()));
});

describe('hub stdio protocol', () => {
  it('tools/list disabled araci gostermez', async () => {
    const client = createClient();
    const transport = createTransport();

    await client.connect(transport);

    const result = await client.listTools();
    const toolNames = result.tools.map((tool) => tool.name);

    expect(toolNames).toContain('aktif_arac');
    expect(toolNames).toContain('_mcpbase_introspect');
    expect(toolNames).not.toContain('pasif_arac');
    expect(toolNames).not.toContain('gizli_arac');
  });

  it('tools/call disabled aracta hata dondurur', async () => {
    const client = createClient();
    const transport = createTransport();

    await client.connect(transport);

    const result = await client.callTool({
      name: 'pasif_arac',
      arguments: {},
    });

    expect(result.isError).toBe(true);
    const content = result.content as Array<{ type: string; text: string }>;
    expect(content[0]?.type).toBe('text');
    expect(content[0]?.text).toContain('disabled');
  });

  it('tools/call hidden aracta not found hatasi dondurur', async () => {
    const client = createClient();
    const transport = createTransport();

    await client.connect(transport);

    const result = await client.callTool({
      name: 'gizli_arac',
      arguments: {},
    });

    expect(result.isError).toBe(true);
    const content = result.content as Array<{ type: string; text: string }>;
    expect(content[0]?.type).toBe('text');
    expect(content[0]?.text.toLowerCase()).toContain('not found');
  });

  it('tools/list introspection aracini ve annotations bilgisini dondurur', async () => {
    const client = createClient();
    const transport = createTransport();

    await client.connect(transport);

    const result = await client.listTools();
    const aktifArac = result.tools.find((tool) => tool.name === 'aktif_arac');
    const introspectionAraci = result.tools.find((tool) => tool.name === '_mcpbase_introspect');

    expect(introspectionAraci).toBeDefined();
    expect(aktifArac).toBeDefined();
    expect(aktifArac?.annotations).toMatchObject({
      readOnlyHint: true,
      idempotentHint: true,
    });
  });

  it('tools/call introspection aracindan yapili sonuc dondurur', async () => {
    const client = createClient();
    const transport = createTransport();

    await client.connect(transport);

    const result = await client.callTool({
      name: '_mcpbase_introspect',
      arguments: {},
    });

    const parsed = z
      .object({
        content: z.array(z.object({ type: z.literal('text'), text: z.string() })),
        structuredContent: z
          .object({
            server: z.object({
              name: z.string(),
              version: z.string(),
            }),
            mcpbase: z.object({
              version: z.string(),
            }),
            telemetry: z.object({
              available: z.boolean(),
            }),
            tools: z.array(
              z.object({
                name: z.string(),
                title: z.string(),
                description: z.string(),
                state: z.enum(['enabled', 'disabled', 'hidden']),
                annotations: z.record(z.string(), z.unknown()).optional(),
              }),
            ),
            toolStates: z
              .array(
                z.object({
                  name: z.string(),
                  state: z.enum(['enabled', 'disabled', 'hidden']),
                  reason: z.string().optional(),
                }),
              )
              .optional(),
          })
          .passthrough(),
      })
      .parse(result);

    expect(parsed.content[0]?.text).toBeTruthy();
    expect(parsed.structuredContent.telemetry.available).toBe(false);
    expect(parsed.structuredContent.tools).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: '_mcpbase_introspect',
          state: 'enabled',
        }),
        expect.objectContaining({
          name: 'aktif_arac',
          state: 'enabled',
          annotations: expect.objectContaining({
            readOnlyHint: true,
            idempotentHint: true,
          }),
        }),
        expect.objectContaining({
          name: 'pasif_arac',
          state: 'disabled',
        }),
        expect.objectContaining({
          name: 'gizli_arac',
          state: 'hidden',
        }),
      ]),
    );
    expect(parsed.structuredContent.toolStates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'pasif_arac',
          state: 'disabled',
          reason: 'bakim',
        }),
        expect.objectContaining({
          name: 'gizli_arac',
          state: 'hidden',
          reason: 'gizli-mod',
        }),
      ]),
    );
  });
});
