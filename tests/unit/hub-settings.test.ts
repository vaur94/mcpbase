import { describe, expect, it } from 'vitest';

import { createSettingsSchema, settingsFieldsFromBaseConfig } from '../../src/hub/settings.js';

describe('merkez ayar yardimcilari', () => {
  it('alanlari gruplara ayirir ve sirali sekilde dondurur', () => {
    const schema = createSettingsSchema([
      {
        key: 'logging.includeTimestamp',
        type: 'boolean',
        required: true,
        label: 'Include Timestamp',
        group: 'Logging',
        order: 2,
      },
      {
        key: 'logging.level',
        type: 'select',
        required: true,
        label: 'Log Level',
        group: 'Logging',
        order: 1,
      },
      {
        key: 'server.name',
        type: 'string',
        required: true,
        label: 'Server Name',
        group: 'Server',
        order: 1,
      },
    ]);

    expect(schema.version).toBe('1.0');
    expect(schema.groups.map((group) => group.key)).toEqual(['logging', 'server']);
    expect(schema.groups[0]?.fields.map((field) => field.key)).toEqual([
      'logging.level',
      'logging.includeTimestamp',
    ]);
  });

  it('grupsuz alanlari general grubuna toplar', () => {
    const schema = createSettingsSchema([
      {
        key: 'ozel.alan',
        type: 'string',
        required: false,
        label: 'Ozel Alan',
      },
    ]);

    expect(schema.groups).toHaveLength(1);
    expect(schema.groups[0]).toMatchObject({
      key: 'general',
      label: 'General',
    });
  });

  it('normalize edilmis grup anahtari cakistiginda farkli etiketleri reddeder', () => {
    expect(() =>
      createSettingsSchema([
        {
          key: 'a.alan',
          type: 'string',
          required: true,
          label: 'A',
          group: 'Server Ops',
        },
        {
          key: 'b.alan',
          type: 'string',
          required: true,
          label: 'B',
          group: 'server-ops',
        },
      ]),
    ).toThrow(/group label mismatch/u);
  });

  it('base config yardimcisi dort sabit alani dondurur', () => {
    const fields = settingsFieldsFromBaseConfig();

    expect(fields.map((field) => field.key)).toEqual([
      'server.name',
      'server.version',
      'logging.level',
      'logging.includeTimestamp',
    ]);
    expect(fields.every((field) => field.label.length > 0)).toBe(true);
    expect(fields.find((field) => field.key === 'server.name')?.default).toBe('mcpbase');
    expect(fields.find((field) => field.key === 'server.version')?.default).toBe('0.1.0');
    expect(fields.find((field) => field.key === 'logging.level')?.default).toBe('info');
    expect(fields.find((field) => field.key === 'logging.includeTimestamp')?.default).toBe(true);
  });
});
