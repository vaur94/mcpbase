import { describe, expect, it } from 'vitest';

import type { BaseAppErrorCode } from '../../src/core/app-error.js';
import { AppError, ensureAppError } from '../../src/core/app-error.js';

describe('AppError - generic refactor', () => {
  describe('BaseAppErrorCode tipi', () => {
    it('sadece 4 temel hata kodunu icerir', () => {
      const codes: BaseAppErrorCode[] = [
        'CONFIG_ERROR',
        'VALIDATION_ERROR',
        'TOOL_NOT_FOUND',
        'TOOL_EXECUTION_ERROR',
      ];

      expect(codes).toHaveLength(4);
    });

    it('PERMISSION_DENIED icermemeli', () => {
      const hasPermissionDenied: 'PERMISSION_DENIED' extends BaseAppErrorCode ? true : false =
        false;

      expect(hasPermissionDenied).toBe(false);
    });
  });

  describe('AppError generic sinifi', () => {
    it('varsayilan tip parametresi ile calisir', () => {
      const error = new AppError('CONFIG_ERROR', 'Yapılandırma hatası');

      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe('CONFIG_ERROR');
      expect(error.name).toBe('AppError');
      expect(error.expose).toBe(true);
    });

    it('ozel hata kodu ile calisir', () => {
      type MyErrorCode = BaseAppErrorCode | 'STORAGE_ERROR';
      const error = new AppError<MyErrorCode>('STORAGE_ERROR', 'Depolama hatası');

      expect(error.code).toBe('STORAGE_ERROR');
    });

    it('detay ve cause ile olusturulur', () => {
      const cause = new Error('Original error');
      const error = new AppError('VALIDATION_ERROR', 'Doğrulama hatası', {
        details: { field: 'email' },
        cause,
        expose: false,
      });

      expect(error.details).toEqual({ field: 'email' });
      expect(error.cause).toBe(cause);
      expect(error.expose).toBe(false);
    });
  });

  describe('ensureAppError fonksiyonu', () => {
    it('AppError ornegini oldugu gibi dondurur', () => {
      const original = new AppError('TOOL_NOT_FOUND', 'Araç bulunamadı');
      const result = ensureAppError(original);

      expect(result).toBe(original);
    });

    it('Error ornegini AppError olarak sarmalar', () => {
      const original = new Error('Boom');
      const result = ensureAppError(original);

      expect(result).toBeInstanceOf(AppError);
      expect(result.code).toBe('TOOL_EXECUTION_ERROR');
      expect(result.expose).toBe(false);
    });

    it('bilinmeyen degeri AppError olarak sarmalar', () => {
      const result = ensureAppError(42);

      expect(result).toBeInstanceOf(AppError);
      expect(result.code).toBe('TOOL_EXECUTION_ERROR');
      expect(result.expose).toBe(false);
    });

    it('generic tip parametresi ile calisir', () => {
      type MyErrorCode = BaseAppErrorCode | 'NETWORK_ERROR';
      const error = new AppError<MyErrorCode>('NETWORK_ERROR', 'Ağ hatası');
      const result = ensureAppError<MyErrorCode>(error);

      expect(result.code).toBe('NETWORK_ERROR');
    });
  });

  describe('geriye uyumluluk', () => {
    it('AppError olmadan tip parametresi kullanilabilir', () => {
      const error = new AppError('CONFIG_ERROR', 'Test');

      expect(error.code).toBe('CONFIG_ERROR');
      expect(error instanceof Error).toBe(true);
    });
  });
});
