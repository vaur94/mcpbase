import { describe, expect, it } from 'vitest';

import type { BaseRuntimeConfig, RuntimeConfig } from '../../src/contracts/runtime-config.js';
import type {
  BaseToolExecutionContext,
  ToolExecutionContext,
} from '../../src/core/execution-context.js';

describe('ToolExecutionContext - generic refactor', () => {
  describe('BaseToolExecutionContext<TConfig> generic arayuzu', () => {
    it('varsayilan tip parametresi ile calisir', () => {
      const context: BaseToolExecutionContext<RuntimeConfig> = {
        requestId: 'req-123',
        toolName: 'test-tool',
        config: {
          server: { name: 'test-server', version: '1.0.0' },
          logging: { level: 'info', includeTimestamp: true },
          security: {
            features: { serverInfoTool: true, textTransformTool: false },
            commands: { allowed: [] },
            paths: { allowed: [] },
          },
        },
      };

      expect(context.requestId).toBe('req-123');
      expect(context.toolName).toBe('test-tool');
      expect(context.config.server.name).toBe('test-server');
    });

    it('generic tip parametresi ile calisir', () => {
      interface MyConfig extends BaseRuntimeConfig {
        customField: string;
      }

      const context: BaseToolExecutionContext<MyConfig> = {
        requestId: 'req-456',
        toolName: 'custom-tool',
        config: {
          server: { name: 'custom-server', version: '2.0.0' },
          logging: { level: 'debug', includeTimestamp: false },
          customField: 'custom-value',
        },
      };

      expect(context.config.customField).toBe('custom-value');
    });

    it('config alani zorunludur, opsiyonel degil', () => {
      type HasConfigField = BaseToolExecutionContext extends { config: unknown } ? true : false;
      expect<HasConfigField>(true).toBe(true);
    });

    it('requestId ve toolName alanlari mevcut', () => {
      const context: BaseToolExecutionContext<RuntimeConfig> = {
        requestId: 'test-id',
        toolName: 'test-name',
        config: {
          server: { name: 'test', version: '1.0' },
          logging: { level: 'info', includeTimestamp: true },
          security: {
            features: { serverInfoTool: true, textTransformTool: true },
            commands: { allowed: [] },
            paths: { allowed: [] },
          },
        },
      };

      expect(typeof context.requestId).toBe('string');
      expect(typeof context.toolName).toBe('string');
    });
  });

  describe('geriye uyumluluk: ToolExecutionContext alias', () => {
    it('ToolExecutionContext geriye uyumlu alias olarak calisir', () => {
      const context: ToolExecutionContext = {
        requestId: 'legacy-req',
        toolName: 'legacy-tool',
        config: {
          server: { name: 'legacy-server', version: '1.0.0' },
          logging: { level: 'warn', includeTimestamp: true },
          security: {
            features: { serverInfoTool: true, textTransformTool: true },
            commands: { allowed: [] },
            paths: { allowed: [] },
          },
        },
      };

      expect(context.requestId).toBe('legacy-req');
      expect(context.toolName).toBe('legacy-tool');
      expect(context.config).toBeDefined();
    });

    it('BaseToolExecutionContext ve ToolExecutionContext ayni', () => {
      const isSameType: ToolExecutionContext extends BaseToolExecutionContext<RuntimeConfig>
        ? BaseToolExecutionContext<RuntimeConfig> extends ToolExecutionContext
          ? true
          : false
        : false = true;

      expect(isSameType).toBe(true);
    });
  });
});
