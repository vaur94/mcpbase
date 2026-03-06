# Release Process

## Flow

1. Conventional commit messages are analyzed by `semantic-release`.
2. When pushed to the `main` branch, quality job completes.
3. Release job calculates the new version.
4. `CHANGELOG.md`, Git tag, and GitHub release are created.
5. If `NPM_TOKEN` is defined, the package is published to npm.

## Required Secrets

- `GITHUB_TOKEN`
- `NPM_TOKEN`

## Why Automated

- Reduces manual version bumping
- Keeps changelog and release record in a single flow
- The same approach is reused in derived MCP projects
