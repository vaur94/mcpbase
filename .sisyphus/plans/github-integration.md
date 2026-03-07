# GitHub Integration & Release Pipeline Fix

## TL;DR

> **Quick Summary**: Fix the broken npm release pipeline (prepack + NPM_TOKEN 2FA issues), migrate to npm Trusted Publishing (OIDC), and complete all missing GitHub integrations (copilot config, dependabot auto-merge, repo metadata, branch protection).
>
> **Deliverables**:
>
> - Working CI/CD pipeline that auto-publishes to npm via OIDC (no tokens)
> - v1.0.2 release triggered by `fix:` commit (resolves ghost v1.0.1 tag)
> - Copilot coding instructions for project conventions
> - Dependabot auto-merge workflow for minor/patch updates
> - GitHub repo metadata (topics, homepage, discussions enabled)
> - Branch protection on main with required status checks
> - Corrected LICENSE copyright holder
>
> **Estimated Effort**: Medium
> **Parallel Execution**: YES — 4 waves
> **Critical Path**: Task 1 → Tasks 2-7 (parallel) → Task 8 → Tasks 9-10 (parallel)

---

## Context

### Original Request

Fix npm auto-release failure, complete ALL GitHub integrations (copilot/bot configs, release automation, package automation, about/license, all git interactions) for `vaur94/mcpbase`.

### Root Cause Analysis

**Two cascading CI failures preventing npm publish:**

1. `prepack: "npm run ci:check"` — runs the FULL quality gate (format+lint+typecheck+test+build) during `npm publish`. Since quality already passed in a prior CI job, this is redundant and causes double-build failures.
2. `NPM_TOKEN` lacks 2FA bypass — npm returns `E403 Forbidden` requiring granular access token with 2FA bypass.

**Result**: npm publish fails → GitHub Release never created → package stuck at v1.0.0 on npm (404). Ghost tag v1.0.1 exists but was never published.

### Interview Summary

**Key Decisions**:

- Package name stays `mcpbase` (unscoped)
- Copyright holder: `vaur94`
- npm approach: Trusted Publishing (OIDC) — eliminates NPM_TOKEN entirely
- Enable: Discussions, Branch protection, Dependabot auto-merge
- Skip: Funding, Wiki changes

**Research Findings**:

- npm Trusted Publishing (OIDC) is GA since July 2025, classic tokens deprecated Nov 2025
- `@semantic-release/npm` v13.0.0+ supports OIDC (current `^12.0.2` must be upgraded)
- OIDC requires Node ≥22.14.0 and npm CLI ≥11.5.1
- CI already has `id-token: write` permission

### Metis Review

**Identified Gaps** (addressed):

- v1.0.1 ghost tag: `fix:` commit after v1.0.1 will trigger v1.0.2 release
- Peer dep risk: `semantic-release@^24.2.9` ↔ `@semantic-release/npm@^13.1.5` compatibility must be verified
- `engines.node`: Must update from `>=20.11.0` to `>=22.14.0` for OIDC
- prepack: Replace with `"npm run build"` (not empty string)

---

## Work Objectives

### Core Objective

Fix the broken npm release pipeline and complete all GitHub repository integrations, resulting in a working CI/CD that auto-publishes to npm via OIDC Trusted Publishing.

### Concrete Deliverables

- `package.json` — fixed prepack, updated engines, upgraded @semantic-release/npm
- `.github/workflows/ci.yml` — OIDC-based release (no NPM_TOKEN)
- `.github/copilot-instructions.md` — project coding standards for Copilot
- `.github/workflows/dependabot-auto-merge.yml` — auto-merge minor/patch PRs
- `LICENSE` — corrected copyright holder
- GitHub repo metadata via API (topics, homepage, discussions)
- Branch protection rules via API

### Definition of Done

- [ ] `npm run ci:check` passes locally
- [ ] Push to main triggers CI → quality passes → semantic-release runs → npm package published → GitHub Release created
- [ ] npm package v1.0.2 is accessible: `npm view mcpbase@1.0.2`
- [ ] GitHub Release v1.0.2 exists with auto-generated changelog
- [ ] Dependabot PRs auto-merge for minor/patch after CI passes

### Must Have

- OIDC Trusted Publishing (no npm tokens in CI)
- `fix:` conventional commit to trigger v1.0.2 after ghost v1.0.1
- prepack script changed to `"npm run build"`
- `@semantic-release/npm` upgraded to `^13.1.5`
- `engines.node` updated to `>=22.14.0`
- Copyright holder fixed to `vaur94`

### Must NOT Have (Guardrails)

- MUST NOT add `registry-url` parameter to `actions/setup-node` step
- MUST NOT add `publishConfig.registry` to `package.json`
- MUST NOT add `provenance: true` to `publishConfig` in `package.json` (semantic-release handles this)
- MUST NOT change `.releaserc.json` plugin order or add new plugins
- MUST NOT touch `src/`, `tests/`, or `docs/` directories
- MUST NOT modify `.prettierignore` (already has CHANGELOG.md)
- MUST NOT change package name, scope, or description
- MUST NOT use `as any`, `@ts-ignore`, or any TypeScript escape hatches
- MUST NOT write non-Turkish user-facing text in source code
- MUST NOT remove or alter existing CI quality gate steps

### Prerequisites (User Action Required BEFORE Push)

> **BLOCKING**: User must configure Trusted Publisher on npmjs.com BEFORE Task 8 pushes to main.
>
> Steps:
>
> 1. Go to https://www.npmjs.com/package/mcpbase/access → Trusted Publishers
> 2. Add GitHub Actions publisher:
>    - Owner: `vaur94`
>    - Repository: `mcpbase`
>    - Workflow: `ci.yml`
>    - Environment: (leave empty)
> 3. Confirm configuration is saved
>
> Without this, OIDC authentication will fail and npm publish will not work.

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision

- **Infrastructure exists**: YES (Vitest, full coverage config)
- **Automated tests**: NO (these changes are config/CI files, not source code)
- **Framework**: Vitest (existing — no changes needed)
- **Rationale**: All changes are in config/CI/metadata files. No source code modified. Existing `npm run ci:check` validates nothing is broken.

### QA Policy

Every task includes agent-executed QA scenarios. Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Config files**: Use Bash — validate JSON/YAML syntax, run affected commands
- **CI workflows**: Use Bash — validate YAML, check for common workflow errors
- **GitHub API**: Use Bash (gh CLI) — verify settings applied correctly
- **Release pipeline**: Use Bash — check npm registry, GitHub releases API

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Sync — sequential prerequisite):
└── Task 1: Git pull to sync local with remote HEAD [quick]

Wave 2 (Core Changes — MAX PARALLEL, 6 tasks):
├── Task 2: Fix package.json (prepack, engines, deps) [quick]
├── Task 3: Rewrite CI workflow for OIDC publishing [unspecified-high]
├── Task 4: Fix LICENSE copyright holder [quick]
├── Task 5: Add .github/copilot-instructions.md [writing]
├── Task 6: Add dependabot auto-merge workflow [quick]
└── Task 7: Set GitHub repo metadata via API [quick]

Wave 3 (Commit & Push — sequential, depends on ALL Wave 2):
└── Task 8: Commit all changes + push to main [quick, git-master]

Wave 4 (Post-Push — parallel):
├── Task 9: Configure branch protection for main [quick]
└── Task 10: Verify release pipeline end-to-end [unspecified-high]

Wave FINAL (After ALL tasks — independent review, 4 parallel):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)

Critical Path: Task 1 → Task 2 → Task 8 → Task 10 → F1-F4
Parallel Speedup: ~60% faster than sequential
Max Concurrent: 6 (Wave 2)
```

### Dependency Matrix

| Task | Depends On | Blocks      | Wave |
| ---- | ---------- | ----------- | ---- |
| 1    | —          | 2,3,4,5,6,7 | 1    |
| 2    | 1          | 8           | 2    |
| 3    | 1          | 8           | 2    |
| 4    | 1          | 8           | 2    |
| 5    | 1          | 8           | 2    |
| 6    | 1          | 8           | 2    |
| 7    | 1          | —           | 2    |
| 8    | 2,3,4,5,6  | 9,10        | 3    |
| 9    | 8          | —           | 4    |
| 10   | 8          | —           | 4    |

### Agent Dispatch Summary

| Wave  | Tasks | Categories                                                                                      |
| ----- | ----- | ----------------------------------------------------------------------------------------------- |
| 1     | 1     | T1 → `quick` + `git-master`                                                                     |
| 2     | 6     | T2 → `quick`, T3 → `unspecified-high`, T4 → `quick`, T5 → `writing`, T6 → `quick`, T7 → `quick` |
| 3     | 1     | T8 → `quick` + `git-master`                                                                     |
| 4     | 2     | T9 → `quick`, T10 → `unspecified-high`                                                          |
| FINAL | 4     | F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`                    |

---

## TODOs

- [x] 1. Git Pull — Sync Local with Remote HEAD

  **What to do**:
  - Run `git pull origin main` to sync local HEAD (`34c6e77`) with remote HEAD (`aabcd11`)
  - Remote is ahead by the v1.0.1 release commit (CHANGELOG.md + package.json version bump by semantic-release)
  - Verify sync: `git log --oneline -3` should show the release commit at HEAD
  - Run `npm ci` after pull to update node_modules with any lock file changes

  **Must NOT do**:
  - Do NOT use `git pull --rebase` (merge is fine, there are no local-only commits)
  - Do NOT modify any files — this is sync only

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`git-master`]
    - `git-master`: Git sync operation, needs safe pull strategy
  - **Skills Evaluated but Omitted**:
    - `playwright`: No browser interaction needed
    - `dev-browser`: No browser interaction needed

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (solo)
  - **Blocks**: Tasks 2, 3, 4, 5, 6, 7
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - Current remote state: `git log origin/main --oneline -5` — Shows the v1.0.1 release commit that local is missing

  **WHY Each Reference Matters**:
  - The remote has a semantic-release commit that bumped package.json version to 1.0.1 and updated CHANGELOG.md. Local must have this before any edits.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Local HEAD matches remote HEAD after pull
    Tool: Bash
    Preconditions: Working directory is clean (no uncommitted changes)
    Steps:
      1. Run: git status — verify "nothing to commit, working tree clean"
      2. Run: git pull origin main
      3. Run: git log --oneline -1 — capture HEAD commit hash
      4. Run: git rev-parse origin/main — capture remote HEAD
      5. Assert: both hashes are identical
    Expected Result: Local and remote HEAD are the same commit
    Failure Indicators: Merge conflicts, diverged branches, "already up to date" when remote is ahead
    Evidence: .sisyphus/evidence/task-1-git-sync.txt

  Scenario: npm ci succeeds after pull
    Tool: Bash
    Preconditions: Git pull completed successfully
    Steps:
      1. Run: npm ci
      2. Assert: exit code 0, no errors in output
    Expected Result: Dependencies installed cleanly matching lock file
    Failure Indicators: npm ERR! messages, lock file conflicts
    Evidence: .sisyphus/evidence/task-1-npm-ci.txt
  ```

  **Commit**: NO (no file changes)

- [x] 2. Fix package.json — prepack, engines, dependency upgrade

  **What to do**:
  - Change `prepack` script from `"npm run ci:check"` to `"npm run build"` (line 69)
  - Update `engines.node` from `">=20.11.0"` to `">=22.14.0"` (line 30) — required for npm OIDC
  - Upgrade `@semantic-release/npm` from `"^12.0.2"` to `"^13.1.5"` (line 80) — adds OIDC support
  - Run `npm install` after editing package.json to update package-lock.json
  - Verify peer dependency compatibility: `@semantic-release/npm@13` must work with `semantic-release@^24.2.9`
  - If peer dep conflict exists, also upgrade `semantic-release` to compatible version

  **Must NOT do**:
  - MUST NOT add `publishConfig.registry` field
  - MUST NOT add `provenance: true` to `publishConfig`
  - MUST NOT change package name, description, or any field other than prepack/engines/devDependencies
  - MUST NOT remove the `prepack` script entirely (keep it as `"npm run build"`)
  - MUST NOT change `engines.npm` value

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `git-master`: No git operations in this task (commit is Task 8)

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 4, 5, 6, 7)
  - **Blocks**: Task 8
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `package.json:69` — Current prepack: `"prepack": "npm run ci:check"` → change to `"npm run build"`
  - `package.json:29-31` — Current engines block: `"node": ">=20.11.0"` → change to `">=22.14.0"`
  - `package.json:80` — Current dep: `"@semantic-release/npm": "^12.0.2"` → change to `"^13.1.5"`

  **API/Type References**:
  - `package.json:88` — `"semantic-release": "^24.2.9"` — check compatibility with @semantic-release/npm@13

  **External References**:
  - npm OIDC requires Node ≥22.14.0 and npm CLI ≥11.5.1
  - `@semantic-release/npm` v13.0.0 changelog: OIDC support via issue #958

  **WHY Each Reference Matters**:
  - `prepack` is the ROOT CAUSE of publish failures — ci:check runs full quality gate redundantly during npm publish
  - `engines.node` must match OIDC minimum requirements or CI Node version won't satisfy
  - `@semantic-release/npm` v12 does NOT support OIDC — v13+ is mandatory for tokenless publishing

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: package.json has correct values after edit
    Tool: Bash
    Preconditions: Task 1 (git sync) completed
    Steps:
      1. Run: node -e "const p=require('./package.json'); console.log(JSON.stringify({prepack:p.scripts.prepack, node:p.engines.node, semrelNpm:p.devDependencies['@semantic-release/npm']}))"
      2. Assert: prepack === "npm run build"
      3. Assert: node === ">=22.14.0"
      4. Assert: semrelNpm starts with "^13"
    Expected Result: All three fields have updated values
    Failure Indicators: Any field retains old value, JSON parse error
    Evidence: .sisyphus/evidence/task-2-package-json-values.txt

  Scenario: No forbidden fields added to package.json
    Tool: Bash
    Preconditions: package.json edited
    Steps:
      1. Run: node -e "const p=require('./package.json'); console.log(JSON.stringify(p.publishConfig))"
      2. Assert: output is {"access":"public"} — no "registry" or "provenance" keys
      3. Run: grep -c "registry-url" package.json || echo "0"
      4. Assert: count is 0
    Expected Result: publishConfig unchanged, no forbidden fields
    Failure Indicators: publishConfig has extra keys
    Evidence: .sisyphus/evidence/task-2-no-forbidden-fields.txt

  Scenario: npm install succeeds and lock file updates
    Tool: Bash
    Preconditions: package.json edited with new dep version
    Steps:
      1. Run: npm install
      2. Assert: exit code 0
      3. Run: npm ls @semantic-release/npm --depth=0
      4. Assert: version shown is 13.x.x
      5. Run: npm ls semantic-release --depth=0
      6. Assert: no peer dep warnings or errors
    Expected Result: Clean install, @semantic-release/npm@13.x resolved, no peer conflicts
    Failure Indicators: ERESOLVE, peer dep conflicts, npm ERR
    Evidence: .sisyphus/evidence/task-2-npm-install.txt
  ```

  **Commit**: YES (groups with Tasks 3-6 in Task 8)
  - Files: `package.json`, `package-lock.json`

- [x] 3. Rewrite CI Workflow for OIDC Trusted Publishing

  **What to do**:
  - Edit `.github/workflows/ci.yml` release job:
    1. **Remove** the "Configure npm authentication" step entirely (lines 54-62) — no more .npmrc creation with NPM_TOKEN
    2. **Remove** `NPM_TOKEN` env var from the "Run semantic-release" step (line 67) — only keep `GITHUB_TOKEN`
    3. Keep `id-token: write` permission (already present at line 38)
    4. Keep all other release job steps unchanged (checkout, setup-node, npm ci)
  - Do NOT modify the quality job at all
  - Verify YAML is valid after editing

  **Must NOT do**:
  - MUST NOT add `registry-url` parameter to `actions/setup-node` step
  - MUST NOT modify the quality job in any way
  - MUST NOT change `.releaserc.json` (plugin order, options, or structure)
  - MUST NOT add environment variables beyond GITHUB_TOKEN
  - MUST NOT remove `id-token: write` from permissions
  - MUST NOT change the `if` condition on the release job
  - MUST NOT change `fetch-depth: 0` on checkout

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `git-master`: No git operations here

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 2, 4, 5, 6, 7)
  - **Blocks**: Task 8
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `.github/workflows/ci.yml:54-62` — "Configure npm authentication" step to REMOVE entirely (creates .npmrc with NPM_TOKEN)
  - `.github/workflows/ci.yml:64-68` — "Run semantic-release" step — remove `NPM_TOKEN` env, keep `GITHUB_TOKEN`
  - `.github/workflows/ci.yml:34-38` — Release job permissions — `id-token: write` already present, keep it
  - `.github/workflows/ci.yml:10-27` — Quality job — DO NOT TOUCH

  **External References**:
  - npm Trusted Publishing uses OIDC: when `NPM_TOKEN` is absent and `id-token: write` is set, `@semantic-release/npm` v13+ auto-negotiates OIDC credentials
  - No `.npmrc` or `registry-url` needed — the plugin handles everything

  **WHY Each Reference Matters**:
  - Lines 54-62 create .npmrc with NPM_TOKEN — this is the SECOND root cause of failures. Removing it enables OIDC.
  - Line 67 passes NPM_TOKEN env — must be removed so @semantic-release/npm falls back to OIDC
  - Lines 34-38 already have id-token:write — this is what OIDC needs, and it's already there
  - Lines 10-27 quality job is working correctly — must NOT be changed

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: CI workflow YAML is valid and has correct structure
    Tool: Bash
    Preconditions: ci.yml has been edited
    Steps:
      1. Run: python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))" or node -e "const yaml=require('yaml'); yaml.parse(require('fs').readFileSync('.github/workflows/ci.yml','utf8'))"
      2. Assert: no YAML parse errors
      3. Run: grep -c "NPM_TOKEN" .github/workflows/ci.yml
      4. Assert: count is 0 (no references to NPM_TOKEN remain)
      5. Run: grep -c "npmrc" .github/workflows/ci.yml
      6. Assert: count is 0 (no .npmrc creation)
      7. Run: grep -c "registry-url" .github/workflows/ci.yml
      8. Assert: count is 0 (forbidden pattern)
    Expected Result: Valid YAML, zero NPM_TOKEN references, zero .npmrc references
    Failure Indicators: YAML parse error, NPM_TOKEN still present, registry-url added
    Evidence: .sisyphus/evidence/task-3-ci-yaml-validation.txt

  Scenario: Release job retains required structure
    Tool: Bash
    Preconditions: ci.yml edited
    Steps:
      1. Run: grep "id-token: write" .github/workflows/ci.yml
      2. Assert: line exists (OIDC permission preserved)
      3. Run: grep "fetch-depth: 0" .github/workflows/ci.yml
      4. Assert: line exists (full history for semantic-release)
      5. Run: grep "GITHUB_TOKEN" .github/workflows/ci.yml
      6. Assert: at least one reference exists
      7. Run: grep "npm run release" .github/workflows/ci.yml || grep "npm run release" .github/workflows/ci.yml
      8. Assert: release command still present
    Expected Result: id-token, fetch-depth, GITHUB_TOKEN, and release command all present
    Failure Indicators: Any required element missing
    Evidence: .sisyphus/evidence/task-3-ci-structure-check.txt

  Scenario: Quality job is completely unchanged
    Tool: Bash
    Preconditions: ci.yml edited
    Steps:
      1. Run: git diff .github/workflows/ci.yml and inspect the quality job section (lines 10-27)
      2. Assert: no diff lines touch the quality job
    Expected Result: Quality job has zero modifications
    Failure Indicators: Any line in quality job section is modified
    Evidence: .sisyphus/evidence/task-3-quality-job-untouched.txt
  ```

  **Commit**: YES (groups with Tasks 2, 4-6 in Task 8)
  - Files: `.github/workflows/ci.yml`

- [x] 4. Fix LICENSE Copyright Holder

  **What to do**:
  - Edit `LICENSE` line 3: change `Copyright (c) 2026 mcpbase` to `Copyright (c) 2026 vaur94`
  - Only change the name, not the year or format

  **Must NOT do**:
  - MUST NOT change the license type (MIT)
  - MUST NOT modify any other line in the file
  - MUST NOT change the year (2026)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 2, 3, 5, 6, 7)
  - **Blocks**: Task 8
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `LICENSE:3` — Current: `Copyright (c) 2026 mcpbase` → Change to `Copyright (c) 2026 vaur94`

  **WHY Each Reference Matters**:
  - User confirmed copyright holder should be `vaur94`, not the project name

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: LICENSE has correct copyright holder
    Tool: Bash
    Preconditions: LICENSE file exists
    Steps:
      1. Run: grep "Copyright" LICENSE
      2. Assert: output contains "Copyright (c) 2026 vaur94"
      3. Assert: output does NOT contain "mcpbase"
      4. Run: wc -l LICENSE
      5. Assert: line count is 21 (unchanged file length)
    Expected Result: Copyright holder is vaur94, file is otherwise unchanged
    Failure Indicators: "mcpbase" still in copyright line, file length changed
    Evidence: .sisyphus/evidence/task-4-license-copyright.txt
  ```

  **Commit**: YES (groups with Tasks 2, 3, 5, 6 in Task 8)
  - Files: `LICENSE`

- [x] 5. Add Copilot Coding Instructions

  **What to do**:
  - Create `.github/copilot-instructions.md` with project-specific coding guidelines
  - Content must reflect the project's actual conventions (from AGENTS.md):
    - TypeScript strict mode: no `as any`, no `@ts-ignore`, no `@ts-expect-error`
    - ESM only: use `.js` extensions in imports, `import type` for type-only imports
    - Turkish-first: all user-facing text and test names in Turkish
    - Zod for all input/output validation
    - Vitest for testing with Turkish test names
    - Conventional commits format
    - No empty catch blocks, no placeholder TODOs
    - MCP protocol: never write to stdout (logs go to stderr)
    - Prettier: single quotes, trailing commas, 100 char width

  **Must NOT do**:
  - MUST NOT create a generic/boilerplate copilot instructions file
  - MUST NOT include instructions that contradict AGENTS.md
  - MUST NOT reference non-existent files or tools

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: Not a frontend task

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 2, 3, 4, 6, 7)
  - **Blocks**: Task 8
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `AGENTS.md` — Full project knowledge base with all coding conventions, rules, and forbidden patterns. READ THIS ENTIRELY before writing copilot-instructions.md.
  - `tsconfig.json` — TypeScript compiler settings (strict, noUncheckedIndexedAccess, verbatimModuleSyntax)
  - `.eslintrc` or `eslint.config.*` — ESLint rules including consistent-type-imports
  - `.prettierrc` or `prettier` config in package.json — Formatting rules

  **External References**:
  - GitHub Copilot instructions format: plain markdown file at `.github/copilot-instructions.md`

  **WHY Each Reference Matters**:
  - AGENTS.md is the single source of truth for all project conventions — copilot-instructions.md must be a distillation of this
  - tsconfig/eslint/prettier configs provide the exact tooling settings Copilot should be aware of

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Copilot instructions file exists with correct content
    Tool: Bash
    Preconditions: File should not exist yet
    Steps:
      1. Run: test -f .github/copilot-instructions.md && echo "EXISTS" || echo "MISSING"
      2. Assert: output is "EXISTS"
      3. Run: grep -c "as any" .github/copilot-instructions.md
      4. Assert: count >= 1 (mentions the forbidden pattern)
      5. Run: grep -ci "turkish\|turkce\|Türkçe" .github/copilot-instructions.md
      6. Assert: count >= 1 (mentions Turkish convention)
      7. Run: grep -ci "zod" .github/copilot-instructions.md
      8. Assert: count >= 1 (mentions Zod)
      9. Run: grep -ci "stderr" .github/copilot-instructions.md
      10. Assert: count >= 1 (mentions stderr logging rule)
    Expected Result: File exists and contains all key project conventions
    Failure Indicators: File missing, key conventions not mentioned
    Evidence: .sisyphus/evidence/task-5-copilot-instructions.txt

  Scenario: Instructions don't contradict AGENTS.md
    Tool: Bash
    Preconditions: Both files exist
    Steps:
      1. Run: grep -i "commonjs\|cjs\|require(" .github/copilot-instructions.md
      2. Assert: no matches (project is ESM-only)
      3. Run: grep -i "jest\|mocha" .github/copilot-instructions.md
      4. Assert: no matches (project uses Vitest, not Jest/Mocha)
    Expected Result: No contradictions to project conventions
    Failure Indicators: References to CJS, wrong test framework, English-only mandate
    Evidence: .sisyphus/evidence/task-5-no-contradictions.txt
  ```

  **Commit**: YES (groups with Tasks 2, 3, 4, 6 in Task 8)
  - Files: `.github/copilot-instructions.md`

- [x] 6. Add Dependabot Auto-Merge Workflow

  **What to do**:
  - Create `.github/workflows/dependabot-auto-merge.yml`
  - Workflow should:
    1. Trigger on `pull_request` events
    2. Only run for `dependabot[bot]` actor
    3. Use `dependabot/fetch-metadata@v2` to detect update type
    4. Auto-approve the PR for non-major updates
    5. Enable auto-merge (squash) for non-major updates using `gh pr merge --auto --squash`
  - Permissions needed: `contents: write`, `pull-requests: write`

  **Must NOT do**:
  - MUST NOT auto-merge major version updates (only minor/patch)
  - MUST NOT skip CI checks (auto-merge waits for required checks to pass)
  - MUST NOT modify existing dependabot.yml configuration

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 2, 3, 4, 5, 7)
  - **Blocks**: Task 8
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `.github/dependabot.yml` — Existing dependabot config (npm weekly + github-actions weekly). Do NOT modify this file.
  - `.github/workflows/ci.yml` — Existing workflow structure for naming/formatting conventions

  **External References**:
  - `dependabot/fetch-metadata@v2` — Action that extracts update-type (version-update:semver-major/minor/patch)
  - `gh pr merge --auto --squash` — GitHub CLI auto-merge command

  **WHY Each Reference Matters**:
  - Existing dependabot.yml shows what ecosystems are tracked — the auto-merge workflow handles PRs from both
  - ci.yml shows the project's YAML formatting style (indentation, naming conventions)

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Auto-merge workflow file exists with correct structure
    Tool: Bash
    Preconditions: File should not exist yet
    Steps:
      1. Run: test -f .github/workflows/dependabot-auto-merge.yml && echo "EXISTS" || echo "MISSING"
      2. Assert: output is "EXISTS"
      3. Run: python3 -c "import yaml; y=yaml.safe_load(open('.github/workflows/dependabot-auto-merge.yml')); print(y['on'])" 2>/dev/null || node -e "console.log('VALID YAML')"
      4. Assert: valid YAML (no parse errors)
      5. Run: grep "dependabot\[bot\]" .github/workflows/dependabot-auto-merge.yml
      6. Assert: actor check is present
      7. Run: grep "semver-major" .github/workflows/dependabot-auto-merge.yml
      8. Assert: major version exclusion is present
      9. Run: grep "auto.*merge\|merge.*auto" .github/workflows/dependabot-auto-merge.yml
      10. Assert: auto-merge command is present
    Expected Result: Valid workflow that checks for dependabot actor, excludes major, enables auto-merge
    Failure Indicators: Invalid YAML, missing actor check, missing major exclusion
    Evidence: .sisyphus/evidence/task-6-dependabot-auto-merge.txt

  Scenario: Existing dependabot.yml is not modified
    Tool: Bash
    Preconditions: Both files exist
    Steps:
      1. Run: git diff .github/dependabot.yml
      2. Assert: no diff output (file unchanged)
    Expected Result: dependabot.yml has zero modifications
    Failure Indicators: Any changes to dependabot.yml
    Evidence: .sisyphus/evidence/task-6-dependabot-yml-unchanged.txt
  ```

  **Commit**: YES (groups with Tasks 2, 3, 4, 5 in Task 8)
  - Files: `.github/workflows/dependabot-auto-merge.yml`

- [x] 7. Set GitHub Repository Metadata via API

  **What to do**:
  - Set repository topics: `mcp`, `mcp-server`, `typescript`, `model-context-protocol`, `stdio`, `reference-architecture`
  - Set homepage URL: `https://github.com/vaur94/mcpbase#readme` (same as package.json homepage)
  - Enable GitHub Discussions on the repository
  - Use `gh` CLI or GitHub API for all operations (no file changes)

  **Must NOT do**:
  - MUST NOT change repository description (already set correctly)
  - MUST NOT enable/disable Wiki, Pages, or Projects
  - MUST NOT change repository visibility (stays public)
  - MUST NOT modify any files in the repository

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 2, 3, 4, 5, 6)
  - **Blocks**: None
  - **Blocked By**: Task 1

  **References**:

  **External References**:
  - `gh repo edit` — CLI command for repository settings
  - `gh api repos/{owner}/{repo}/topics` — API endpoint for topics
  - `package.json:44-51` — keywords array (use similar topics): `mcp`, `model-context-protocol`, `typescript`, `stdio`, `reference-architecture`, `template`

  **WHY Each Reference Matters**:
  - Topics should align with package.json keywords for discoverability
  - Homepage should match the package.json homepage field

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Repository topics are set correctly
    Tool: Bash
    Preconditions: Authenticated with gh CLI
    Steps:
      1. Run: gh api repos/vaur94/mcpbase/topics -q '.names[]' | sort
      2. Assert: output contains at least: mcp, mcp-server, model-context-protocol, typescript
    Expected Result: Topics are set and visible on repository page
    Failure Indicators: Empty topics, API error, wrong topic names
    Evidence: .sisyphus/evidence/task-7-topics.txt

  Scenario: Discussions are enabled
    Tool: Bash
    Preconditions: Authenticated with gh CLI
    Steps:
      1. Run: gh api repos/vaur94/mcpbase -q '.has_discussions'
      2. Assert: output is "true"
    Expected Result: Discussions feature is enabled
    Failure Indicators: "false" or API error
    Evidence: .sisyphus/evidence/task-7-discussions.txt

  Scenario: Homepage URL is set
    Tool: Bash
    Preconditions: Authenticated with gh CLI
    Steps:
      1. Run: gh api repos/vaur94/mcpbase -q '.homepage'
      2. Assert: output is "https://github.com/vaur94/mcpbase#readme" or similar valid URL
    Expected Result: Homepage is set and visible
    Failure Indicators: Empty string or null
    Evidence: .sisyphus/evidence/task-7-homepage.txt
  ```

  **Commit**: NO (API-only, no file changes)

- [x] 8. Commit All Changes and Push to Main

  **What to do**:
  - **PREREQUISITE CHECK**: Before pushing, confirm that the user has configured npm Trusted Publisher on npmjs.com (see Prerequisites section in Work Objectives). If not confirmed, STOP and ask user.
  - Stage all modified/new files from Tasks 2-6:
    - `package.json`
    - `package-lock.json`
    - `.github/workflows/ci.yml`
    - `LICENSE`
    - `.github/copilot-instructions.md`
    - `.github/workflows/dependabot-auto-merge.yml`
  - Run `npm run ci:check` as pre-commit validation (must pass)
  - Commit with EXACT message:

    ```
    fix(ci): migrate to npm OIDC trusted publishing and fix release pipeline

    - Replace prepack ci:check with build-only to prevent redundant quality gate
    - Upgrade @semantic-release/npm to v13+ for OIDC support
    - Remove NPM_TOKEN from CI workflow (OIDC replaces token auth)
    - Update engines.node to >=22.14.0 (OIDC requirement)
    - Fix LICENSE copyright holder to vaur94
    - Add Copilot coding instructions
    - Add dependabot auto-merge workflow for minor/patch updates
    ```

  - Push to `origin main`
  - The `fix:` prefix ensures semantic-release will create a new PATCH release (v1.0.2)

  **Must NOT do**:
  - MUST NOT push without running `npm run ci:check` first
  - MUST NOT push without user confirming Trusted Publisher configuration
  - MUST NOT use `--force` push
  - MUST NOT amend existing commits
  - MUST NOT include files from src/, tests/, or docs/ in the commit
  - MUST NOT split into multiple commits (single commit triggers single release)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`git-master`]
    - `git-master`: Git commit and push operations, commit message formatting
  - **Skills Evaluated but Omitted**:
    - `playwright`: No browser interaction

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (solo)
  - **Blocks**: Tasks 9, 10
  - **Blocked By**: Tasks 2, 3, 4, 5, 6

  **References**:

  **Pattern References**:
  - Commit Strategy section of this plan — exact commit message to use
  - `.releaserc.json:4` — `@semantic-release/commit-analyzer` parses the commit type. `fix:` → PATCH release.
  - `.releaserc.json:14-19` — `@semantic-release/git` will create a follow-up release commit with version bump

  **WHY Each Reference Matters**:
  - The commit message format is CRITICAL — semantic-release uses conventional commits to determine release type. `fix:` = patch, `feat:` = minor, `BREAKING CHANGE:` = major.
  - Single commit ensures single release. Multiple fix commits would still result in one release, but cleaner this way.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: ci:check passes before commit
    Tool: Bash
    Preconditions: All file changes from Tasks 2-6 are in working directory
    Steps:
      1. Run: npm run ci:check
      2. Assert: exit code 0, all checks pass
    Expected Result: Full quality gate passes with all changes
    Failure Indicators: Any check fails (format, lint, typecheck, test, build)
    Evidence: .sisyphus/evidence/task-8-ci-check.txt

  Scenario: Commit is created with correct message and files
    Tool: Bash
    Preconditions: ci:check passed
    Steps:
      1. Run: git add package.json package-lock.json .github/workflows/ci.yml LICENSE .github/copilot-instructions.md .github/workflows/dependabot-auto-merge.yml
      2. Run: git status --porcelain
      3. Assert: only the 6 expected files are staged (no src/, tests/, docs/ files)
      4. Run: git commit with the exact message from commit strategy
      5. Run: git log --oneline -1
      6. Assert: commit message starts with "fix(ci):"
    Expected Result: Single commit with exactly the 6 expected files
    Failure Indicators: Wrong files staged, wrong commit message, source files included
    Evidence: .sisyphus/evidence/task-8-commit.txt

  Scenario: Push succeeds to origin main
    Tool: Bash
    Preconditions: Commit created, Trusted Publisher confirmed by user
    Steps:
      1. Run: git push origin main
      2. Assert: exit code 0, "main -> main" in output
      3. Run: git log origin/main --oneline -1
      4. Assert: remote HEAD matches local HEAD
    Expected Result: Push succeeds, remote updated
    Failure Indicators: Push rejected, permission denied, branch protection blocks
    Evidence: .sisyphus/evidence/task-8-push.txt
  ```

  **Commit**: YES (this IS the commit task)
  - Message: `fix(ci): migrate to npm OIDC trusted publishing and fix release pipeline`
  - Files: `package.json`, `package-lock.json`, `.github/workflows/ci.yml`, `LICENSE`, `.github/copilot-instructions.md`, `.github/workflows/dependabot-auto-merge.yml`
  - Pre-commit: `npm run ci:check`

- [x] 9. Configure Branch Protection for Main

  **What to do**:
  - Set up branch protection rules on `main` branch via GitHub API:
    1. Require status checks to pass before merging: require the "Quality Gates" check (the quality job name from ci.yml)
    2. Require branches to be up to date before merging
    3. Require conversation resolution before merging
    4. Do NOT require pull request reviews (sole maintainer workflow)
    5. Do NOT require signed commits
    6. Allow force pushes: NO
    7. Allow deletions: NO
  - Use `gh api` or `gh` CLI commands

  **Must NOT do**:
  - MUST NOT require PR reviews (would block sole maintainer from pushing)
  - MUST NOT require signed commits
  - MUST NOT modify any files
  - MUST NOT set up branch protection BEFORE Task 8 pushes (would block the fix push)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Task 10)
  - **Blocks**: None
  - **Blocked By**: Task 8

  **References**:

  **Pattern References**:
  - `.github/workflows/ci.yml:10-11` — Quality job is named "Quality Gates" — this is the status check name to require

  **External References**:
  - GitHub branch protection API: `PUT /repos/{owner}/{repo}/branches/{branch}/protection`
  - `gh api` command for setting protection rules

  **WHY Each Reference Matters**:
  - The exact job name "Quality Gates" must be used as the required status check context, otherwise GitHub won't match CI runs to the protection rule

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Branch protection is active with correct rules
    Tool: Bash
    Preconditions: Task 8 push completed, authenticated with gh CLI
    Steps:
      1. Run: gh api repos/vaur94/mcpbase/branches/main/protection -q '.required_status_checks'
      2. Assert: response includes status check context "Quality Gates"
      3. Assert: strict is true (require branches to be up to date)
      4. Run: gh api repos/vaur94/mcpbase/branches/main/protection -q '.enforce_admins.enabled'
      5. Note: this may or may not be enforced for admins — either is acceptable
      6. Run: gh api repos/vaur94/mcpbase/branches/main/protection -q '.allow_force_pushes.enabled'
      7. Assert: false (force pushes not allowed)
    Expected Result: Branch protection active with Quality Gates check required
    Failure Indicators: 404 (no protection), wrong check name, force pushes allowed
    Evidence: .sisyphus/evidence/task-9-branch-protection.txt

  Scenario: PR reviews are NOT required
    Tool: Bash
    Preconditions: Branch protection configured
    Steps:
      1. Run: gh api repos/vaur94/mcpbase/branches/main/protection/required_pull_request_reviews 2>&1
      2. Assert: 404 or empty (no PR review requirement)
    Expected Result: No required PR reviews (sole maintainer can push/merge freely)
    Failure Indicators: PR review requirements exist
    Evidence: .sisyphus/evidence/task-9-no-pr-reviews.txt
  ```

  **Commit**: NO (API-only, no file changes)

- [x] 10. Verify Release Pipeline End-to-End

  **What to do**:
  - Wait for CI workflow to trigger after Task 8 push (may take 1-3 minutes)
  - Monitor the CI run:
    1. Check quality job passes
    2. Check release job starts after quality passes
    3. Check semantic-release creates v1.0.2
  - Verify npm publish succeeded:
    1. `npm view mcpbase@1.0.2` should return package metadata
    2. If npm shows 404, the Trusted Publisher may not be configured — report this clearly
  - Verify GitHub Release:
    1. `gh release view v1.0.2` should show release with changelog
  - If pipeline fails, capture the error and report with diagnosis

  **Must NOT do**:
  - MUST NOT modify any files to fix failures (report them for human intervention)
  - MUST NOT re-trigger CI manually unless initial run clearly had transient failure
  - MUST NOT create GitHub Release manually (semantic-release must do it)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Task 9)
  - **Blocks**: None
  - **Blocked By**: Task 8

  **References**:

  **Pattern References**:
  - `.github/workflows/ci.yml` — CI workflow structure (quality → release)
  - `.releaserc.json` — semantic-release config (determines release behavior)

  **External References**:
  - `gh run list --limit 5` — List recent CI runs
  - `gh run watch` — Watch a CI run in real-time
  - `npm view mcpbase` — Check npm registry
  - `gh release list` — List releases

  **WHY Each Reference Matters**:
  - CI must run both jobs (quality + release) successfully for the pipeline to complete
  - semantic-release reads the `fix:` commit and determines it's a PATCH release → v1.0.2
  - npm view confirms the package is actually published and accessible

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: CI quality job passes
    Tool: Bash
    Preconditions: Task 8 push completed
    Steps:
      1. Run: gh run list --limit 3 --json status,conclusion,name,headSha
      2. Find the run triggered by our push (match headSha)
      3. If still running, wait: gh run watch {run-id}
      4. Assert: quality job conclusion is "success"
    Expected Result: Quality Gates job passes
    Failure Indicators: Quality job fails (indicates our changes broke something)
    Evidence: .sisyphus/evidence/task-10-ci-quality.txt

  Scenario: Semantic release creates v1.0.2
    Tool: Bash
    Preconditions: Quality job passed, release job running/completed
    Steps:
      1. Run: gh run list --limit 3 --json status,conclusion,name
      2. Wait for release job to complete if still running
      3. Run: gh release view v1.0.2 --json tagName,name,body
      4. Assert: release exists with tag v1.0.2
      5. Assert: body contains changelog entries
    Expected Result: GitHub Release v1.0.2 exists with auto-generated notes
    Failure Indicators: No release created, release job failed
    Evidence: .sisyphus/evidence/task-10-github-release.txt

  Scenario: npm package v1.0.2 is published
    Tool: Bash
    Preconditions: Release job completed successfully
    Steps:
      1. Run: npm view mcpbase@1.0.2 version
      2. Assert: output is "1.0.2"
      3. Run: npm view mcpbase@1.0.2 dist.tarball
      4. Assert: URL is returned (package is downloadable)
    Expected Result: Package v1.0.2 exists on npm registry
    Failure Indicators: 404, E403 (OIDC not configured), version not found
    Evidence: .sisyphus/evidence/task-10-npm-publish.txt

  Scenario: npm publish failure diagnosis (if applicable)
    Tool: Bash
    Preconditions: Release job failed
    Steps:
      1. Run: gh run view {run-id} --log-failed
      2. Capture error output
      3. If E403: Trusted Publisher not configured on npmjs.com
      4. If OIDC error: id-token permission or npm version issue
      5. Report exact error for human intervention
    Expected Result: Clear diagnosis of failure cause
    Failure Indicators: N/A (this is the diagnostic scenario)
    Evidence: .sisyphus/evidence/task-10-failure-diagnosis.txt
  ```

  **Commit**: NO (verification only)

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [ ] F1. **Plan Compliance Audit** — `oracle`
      Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
      Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
      Run `npm run ci:check` from project root. Review all changed files for: malformed JSON/YAML, missing required fields, inconsistent formatting. Check that no source code (src/, tests/) was modified. Verify package-lock.json is consistent with package.json changes.
      Output: `ci:check [PASS/FAIL] | Files [N clean/N issues] | Source Untouched [YES/NO] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high`
      Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration: does the full pipeline work end-to-end? Check: npm view mcpbase, GitHub releases page, dependabot auto-merge status, copilot instructions visibility. Save to `.sisyphus/evidence/final-qa/`.
      Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
      For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built, nothing beyond spec was built. Check "Must NOT do" compliance: no registry-url, no publishConfig.registry, no provenance in publishConfig, .releaserc.json unchanged in structure, src/tests/docs untouched. Flag unaccounted changes.
      Output: `Tasks [N/N compliant] | Guardrails [N/N respected] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

All file changes (Tasks 2-6) go into a SINGLE commit:

```
fix(ci): migrate to npm OIDC trusted publishing and fix release pipeline

- Replace prepack ci:check with build-only to prevent redundant quality gate
- Upgrade @semantic-release/npm to v13+ for OIDC support
- Remove NPM_TOKEN from CI workflow (OIDC replaces token auth)
- Update engines.node to >=22.14.0 (OIDC requirement)
- Fix LICENSE copyright holder to vaur94
- Add Copilot coding instructions
- Add dependabot auto-merge workflow for minor/patch updates
```

Files in commit:

- `package.json`
- `package-lock.json`
- `.github/workflows/ci.yml`
- `.github/copilot-instructions.md`
- `.github/workflows/dependabot-auto-merge.yml`
- `LICENSE`

Pre-commit check: `npm run ci:check` must pass.

---

## Success Criteria

### Verification Commands

```bash
npm run ci:check          # Expected: all quality gates pass (exit 0)
npm view mcpbase@1.0.2    # Expected: package metadata displayed (not 404)
gh release view v1.0.2    # Expected: release with changelog notes
gh api repos/vaur94/mcpbase/topics | jq '.names'  # Expected: ["mcp","mcp-server","typescript","model-context-protocol"]
gh api repos/vaur94/mcpbase -q '.has_discussions'  # Expected: true
gh api repos/vaur94/mcpbase/branches/main/protection -q '.required_status_checks.contexts'  # Expected: ["Quality Gates"]
```

### Final Checklist

- [ ] All "Must Have" present (OIDC, fix commit, prepack, deps, engines, copyright)
- [ ] All "Must NOT Have" absent (no registry-url, no publishConfig.registry, no provenance in publishConfig, .releaserc.json structure intact, src/tests/docs untouched)
- [ ] `npm run ci:check` passes
- [ ] v1.0.2 published to npm
- [ ] GitHub Release v1.0.2 exists
- [ ] Copilot instructions visible in repo
- [ ] Dependabot auto-merge workflow present
- [ ] Branch protection active on main
- [ ] Repo topics and discussions configured
