import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';

import { AppError } from '../core/app-error.js';

export async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function readJsonFile(path: string): Promise<unknown> {
  try {
    const content = await readFile(path, 'utf8');
    return JSON.parse(content) as unknown;
  } catch (error) {
    throw new AppError('CONFIG_ERROR', `Failed to read JSON file: ${path}`, {
      cause: error,
      expose: true,
    });
  }
}
