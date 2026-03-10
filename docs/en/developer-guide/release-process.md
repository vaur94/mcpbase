# Release Process

Turkce surum: [docs/developer-guide/release-process.md](../../developer-guide/release-process.md)

## Verified flow

1. Pull requests and pushes run the quality job in `.github/workflows/ci.yml`.
2. Pushes to `main` continue to the `release` job after quality passes.
3. The release job runs `npm run release`.
4. That command invokes the configured `semantic-release` chain for version analysis and GitHub release steps.

## Confirmed inputs

- Conventional commits drive release analysis.
- The workflow provides `GITHUB_TOKEN` to the release job.
- Workflow permissions include `contents`, `issues`, `pull-requests`, and `id-token` write access.

## Requires maintainer confirmation

The repository does not document the npm publish authentication path explicitly. Even though `id-token: write` is present, maintainers should confirm whether npm trusted publishing or another auth path is the intended production setup.

## Related files

- `.github/workflows/ci.yml`
- `.releaserc.json`
- `package.json`
- `CHANGELOG.md`

Last updated: 2026-03-11
