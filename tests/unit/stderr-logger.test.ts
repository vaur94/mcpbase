import { describe, expect, it, vi } from 'vitest';

import { StderrLogger } from '../../src/logging/stderr-logger.js';

describe('StderrLogger', () => {
  it('mesaji stderr uzerinden yapilandirilmis JSON olarak yazar', () => {
    const logger = new StderrLogger({ level: 'debug', includeTimestamp: false });
    const writeSpy = vi.spyOn(process.stderr, 'write').mockReturnValue(true);

    logger.info('Satir\nIci\tMesaj', { requestId: 'req-1', toolName: 'demo' });

    expect(writeSpy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(String(writeSpy.mock.calls[0]?.[0]).trim()) as {
      level: string;
      message: string;
      requestId: string;
      toolName: string;
      timestamp?: string;
    };
    expect(payload.level).toBe('info');
    expect(payload.message).toBe('Satir Ici Mesaj');
    expect(payload.requestId).toBe('req-1');
    expect(payload.toolName).toBe('demo');
    expect(payload.timestamp).toBeUndefined();

    writeSpy.mockRestore();
  });
});
