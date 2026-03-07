# Learnings — github-integration

## Project Conventions
- TypeScript strict: no `as any`, `@ts-ignore`, `@ts-expect-error`
- ESM only: `.js` extensions in imports, `import type` for type-only imports
- Turkish-first: all user-facing text and test names in Turkish
- Zod for all input/output validation
- Vitest with Turkish test names
- Conventional commits (semantic-release)
- No empty catch blocks, no placeholder TODOs
- MCP protocol: never write to stdout (logs go to stderr)
- Prettier: single quotes, trailing commas, 100 char width

## Key Files
- `package.json:69` — prepack script (target: change ci:check → build)
- `package.json:30` — engines.node (target: >=20.11.0 → >=22.14.0)
- `package.json:80` — @semantic-release/npm (target: ^12.0.2 → ^13.1.5)
- `.github/workflows/ci.yml:54-62` — NPM_TOKEN .npmrc creation step (DELETE)
- `.github/workflows/ci.yml:67` — NPM_TOKEN env in release step (DELETE)
- `LICENSE:3` — Copyright mcpbase → vaur94
- `.releaserc.json` — DO NOT MODIFY (plugin order is critical)
