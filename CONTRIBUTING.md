# Contributing

English | [Turkce](./CONTRIBUTING.tr.md)

## Workflow

1. Install dependencies with `./scripts/install.sh` or run `npm install` and `npm run build`.
2. Keep changes focused and repository-consistent.
3. Run the narrowest relevant test command first, then finish with `npm run ci:check`.
4. Update English and Turkish documentation together when behavior, commands, or public API change.
5. Open pull requests with a conventional commit history and a clear validation summary.

## Expectations

- Preserve ESM-only imports with `.js` file extensions where applicable.
- Do not use stdout for MCP logs.
- Add or update tests for critical runtime, transport, security, or config behavior.
- Keep root docs, docs pages, and examples aligned with `package.json`, workflows, and source exports.

## Review signals

- `CODEOWNERS` currently maps the repository to `@vaur94`.
- Quality gates are defined in `.github/workflows/ci.yml` and `package.json`.
- Docs changes should mention the affected pages in the pull request.

Last updated: 2026-03-11
