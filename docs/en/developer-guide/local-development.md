# Local Development

## Setup

```bash
npm install
npm run build
```

or:

```bash
./scripts/install.sh
```

## Daily Flow

1. Make your change
2. Run the relevant test layer
3. Pass all quality gates with `npm run ci:check`

## Important Files

- `package.json`: Scripts, package identity, and publish settings
- `tsconfig.json`: Strict TS rules
- `tsup.config.ts`: ESM output and type generation
- `vitest.config.ts`: Test and coverage standards
- `.releaserc.json`: Semver and release behavior
