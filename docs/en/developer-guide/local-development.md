# Local Development

Turkce surum: [docs/developer-guide/local-development.md](../../developer-guide/local-development.md)

## Setup

Requirements:

- Node.js `>=22.14.0`
- npm `>=10.0.0`

```bash
./scripts/install.sh
```

or:

```bash
npm install
npm run build
```

## Daily flow

1. Make the change.
2. Start with the narrowest relevant test layer (`npm run test:unit`, `npm run test:integration`, or `npm run test:protocol`).
3. Run `npm run typecheck` and `npm run build` when the change affects public or runtime behavior.
4. Finish with `npm run ci:check`.

## Important files

- `package.json`: scripts, exports, engine constraints, and publish settings
- `tsconfig.json`: NodeNext and strict TypeScript settings
- `tsup.config.ts`: ESM output, declaration generation, and subpath build entries
- `vitest.config.ts`: test discovery and coverage thresholds
- `.releaserc.json`: semantic-release plugin chain
- `.github/workflows/ci.yml`: quality and release automation

## Documentation note

When behavior, commands, or public API change, update the English and Turkish docs together.

Last updated: 2026-03-11
