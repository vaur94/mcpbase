import { baseDefaultConfig } from '../config/default-config.js';

export interface SettingsFieldMeta {
  readonly label: string;
  readonly description?: string;
  readonly group?: string;
  readonly hint?: string;
  readonly secret?: boolean;
  readonly order?: number;
}

export interface SettingsSelectOption {
  readonly value: string | number | boolean;
  readonly label: string;
  readonly description?: string;
}

export interface SettingsField extends SettingsFieldMeta {
  readonly key: string;
  readonly type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect' | 'path';
  readonly required: boolean;
  readonly default?: unknown;
  readonly options?: readonly SettingsSelectOption[];
  readonly validation?: {
    readonly min?: number;
    readonly max?: number;
    readonly minLength?: number;
    readonly maxLength?: number;
    readonly pattern?: string;
  };
}

export interface SettingsGroup {
  readonly key: string;
  readonly label: string;
  readonly description?: string;
  readonly fields: readonly SettingsField[];
}

export interface SettingsSchema {
  readonly groups: readonly SettingsGroup[];
  readonly version: string;
}

const SETTINGS_SCHEMA_VERSION = '1.0';
const UNGROUPED_SETTINGS_KEY = 'general';
const UNGROUPED_SETTINGS_LABEL = 'General';

const baseLoggingLevelOptions = [
  { value: 'debug', label: 'Debug', description: 'Verbose diagnostic logging.' },
  { value: 'info', label: 'Info', description: 'Standard operational logging.' },
  { value: 'warn', label: 'Warn', description: 'Warnings and recoverable issues.' },
  { value: 'error', label: 'Error', description: 'Errors only.' },
] as const satisfies readonly SettingsSelectOption[];

export function createSettingsSchema(fields: SettingsField[]): SettingsSchema {
  const sortedFields = [...fields].sort((left, right) => {
    const leftOrder = left.order ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = right.order ?? Number.MAX_SAFE_INTEGER;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return left.key.localeCompare(right.key);
  });

  const groups = new Map<string, { label: string; fields: SettingsField[] }>();

  for (const field of sortedFields) {
    const label = field.group ?? UNGROUPED_SETTINGS_LABEL;
    const key = field.group ? toGroupKey(field.group) : UNGROUPED_SETTINGS_KEY;
    const group = groups.get(key);

    if (group) {
      if (group.label !== label) {
        throw new Error(
          `Settings group label mismatch for "${key}": expected "${group.label}", received "${label}".`,
        );
      }

      group.fields.push(field);
      continue;
    }

    groups.set(key, {
      label,
      fields: [field],
    });
  }

  return {
    version: SETTINGS_SCHEMA_VERSION,
    groups: [...groups.entries()].map(([key, group]) => ({
      key,
      label: group.label,
      fields: group.fields,
    })),
  };
}

export function settingsFieldsFromBaseConfig(): SettingsField[] {
  return [
    {
      key: 'server.name',
      type: 'string',
      required: true,
      label: 'Server Name',
      description: 'Displayed MCP server name.',
      group: 'Server',
      hint: 'my-mcp-server',
      order: 1,
      default: baseDefaultConfig.server.name,
      validation: {
        minLength: 1,
      },
    },
    {
      key: 'server.version',
      type: 'string',
      required: true,
      label: 'Server Version',
      description: 'Displayed MCP server version.',
      group: 'Server',
      hint: '1.0.0',
      order: 2,
      default: baseDefaultConfig.server.version,
      validation: {
        minLength: 1,
      },
    },
    {
      key: 'logging.level',
      type: 'select',
      required: true,
      label: 'Log Level',
      description: 'Controls runtime logging verbosity.',
      group: 'Logging',
      hint: 'info',
      order: 1,
      default: baseDefaultConfig.logging.level,
      options: baseLoggingLevelOptions,
    },
    {
      key: 'logging.includeTimestamp',
      type: 'boolean',
      required: true,
      label: 'Include Timestamp',
      description: 'Adds timestamps to log output.',
      group: 'Logging',
      hint: 'true',
      order: 2,
      default: baseDefaultConfig.logging.includeTimestamp,
    },
  ];
}

function toGroupKey(group: string): string {
  return group
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
