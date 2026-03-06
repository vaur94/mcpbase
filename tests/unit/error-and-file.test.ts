import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';

import { describe, expect, it } from 'vitest';

import { AppError, ensureAppError } from '../../src/core/app-error.js';
import { fileExists, readJsonFile } from '../../src/infrastructure/json-file.js';

describe('error and file helpers', () => {
  it('normalizes non-AppError values', () => {
    const normalized = ensureAppError(new Error('boom'));
    const fallback = ensureAppError('raw-error');

    expect(normalized).toBeInstanceOf(AppError);
    expect(normalized.code).toBe('TOOL_EXECUTION_ERROR');
    expect(fallback.code).toBe('TOOL_EXECUTION_ERROR');
  });

  it('checks file existence and reads JSON', async () => {
    const tempDir = await mkdtemp(path.join(tmpdir(), 'mcpbase-file-'));
    const jsonPath = path.join(tempDir, 'valid.json');
    const brokenPath = path.join(tempDir, 'broken.json');

    await writeFile(jsonPath, JSON.stringify({ ok: true }), 'utf8');
    await writeFile(brokenPath, '{', 'utf8');

    await expect(fileExists(jsonPath)).resolves.toBe(true);
    await expect(fileExists(path.join(tempDir, 'missing.json'))).resolves.toBe(false);
    await expect(readJsonFile(jsonPath)).resolves.toEqual({ ok: true });
    await expect(readJsonFile(brokenPath)).rejects.toThrow(/Failed to read JSON file/u);
  });
});
