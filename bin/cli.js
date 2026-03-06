#!/usr/bin/env node

import process from 'node:process';

try {
  const { bootstrap } = await import('../dist/index.js');
  await bootstrap(process.argv.slice(2));
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  process.stderr.write(`${JSON.stringify({ level: 'error', message })}\n`);
  process.exit(1);
}
