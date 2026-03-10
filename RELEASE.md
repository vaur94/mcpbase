# Release Overview

English | [Turkce](./RELEASE.tr.md)

## Verified release flow

1. Pull requests and pushes run the quality workflow in `.github/workflows/ci.yml`.
2. Pushes to `main` that pass quality gates continue to the `release` job.
3. The release job runs `npm run release`, which invokes `semantic-release`.
4. The repository config grants `contents`, `issues`, `pull-requests`, and `id-token` write permissions to that job.

## What is confirmed

- Conventional commits drive release analysis.
- GitHub release automation is wired through the workflow and release configuration.
- `CHANGELOG.md` exists in the repository, but changelog file maintenance should be treated as configuration-dependent because `.releaserc.json` does not currently load `@semantic-release/changelog` or `@semantic-release/git`.

## Requires maintainer confirmation

- The exact npm publish authentication path is not documented explicitly in the repository.
- The workflow exposes `GITHUB_TOKEN` directly and grants `id-token: write`, but maintainers should confirm whether npm trusted publishing or another npm auth path is the intended production setup.

## Related docs

- English release guide: [`docs/en/developer-guide/release-process.md`](./docs/en/developer-guide/release-process.md)
- Turkish release guide: [`docs/developer-guide/release-process.md`](./docs/developer-guide/release-process.md)

Last updated: 2026-03-11
