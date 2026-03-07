# mcpbase v2.0 — Generic Base Package Refactoring

## TL;DR

> **Quick Summary**: mcpbase'i fork-template'den npm-installable generic library'ye dönüştür. Tüm core tipler TypeScript generics ile parametrik hale gelecek, MCP spec'in 6 capability'si desteklenecek, Streamable HTTP transport eklenecek ve hook sistemi kurulacak. Hedef: `npm install @vaur94/mcpbase` ile herhangi bir MCP sunucu projesi bu paketi base olarak kullanabilir.
>
> **Deliverables**:
> - Generic type system (BaseRuntimeConfig<TExtras>, AppError<TCode>, BaseToolExecutionContext<TConfig>, ToolDefinition<I,O,TContext>, ApplicationRuntime<TConfig,TContext>, ToolRegistry<TContext>)
> - Config schema factory fonksiyonları (createRuntimeConfigSchema, createPartialRuntimeConfigSchema)
> - Execution hook sistemi (beforeExecute, afterExecute, onError)
> - MCP capabilities: Resources, Prompts, Logging registration abstractions
> - MCP capabilities: Sampling client helper, Roots notification handler
> - Streamable HTTP transport adapter + transport factory
> - Subpath exports: `@vaur94/mcpbase/examples`, `@vaur94/mcpbase/security`
> - Options-based bootstrap<TConfig, TContext>(options)
> - Tam export completeness (Logger, ToolExecutionContext, result types, Zod schemas, utilities)
> - Migration guide v1 → v2
> - TDD test suite (tüm yeni code test-first)
>
> **Estimated Effort**: XL
> **Parallel Execution**: YES - 5 waves + final verification
> **Critical Path**: Task 1→ Task 8 → Task 9 → Task 11 → Task 17 → Task 20 → FINAL

---

## Context

### Original Request
mcpbase'i artık net bir tekil paket haline getirdik. Şimdi diğer MCP sınıflarını oluşturmak için kullanacağımız bu paketin kapsamı ve derinliği tam olmalı — tüm MCP geliştirmelerinde sorunsuz bir şekilde ana bağımlılık olarak çalışması gerekiyor.

### Interview Summary
**Key Discussions**:
- **Dağıtım**: npm publish, @vaur94/mcpbase olarak bağımsız paket
- **MCP Capabilities**: Tüm 6 capability desteklenecek (Tools, Resources, Prompts, Sampling, Roots, Logging)
- **Transport**: Stdio (mevcut) + Streamable HTTP (yeni). SSE deprecated — dahil edilmeyecek
- **Extensibility**: Hook sistemi (orta seviye). Plugin/DI mimarisi yok
- **Example code**: Subpath export'lara taşınacak (@vaur94/mcpbase/examples, @vaur94/mcpbase/security)
- **Breaking change**: Direkt v2.0.0 major bump
- **Test**: TDD — test first, implementation second
- **Scope**: Sadece mcpbase. mcp-contextops ve mcp-fileops entegrasyonu ayrı planlarda

**Cross-Repo Analysis** (3 derived sunucu):
| Modül | mcpbase | mcp-contextops | mcp-fileops |
|-------|---------|----------------|-------------|
| Config extras | security | storage | limits |
| AppErrorCode | 5 | 11 (+6) | 12 (+8) |
| ToolExecutionContext | base 3 fields | +storage | base 3 |
| ToolDefinition extras | security | none | annotations |
| Runtime args | positional | +storage param | options-based |

**Research Findings**:
- **Export Audit**: 10+ critical types not exported (Logger, ToolExecutionContext, result types, Zod schemas)
- **Consumer Analysis**: Package works as fork template but fails as extensible library — bootstrap is black box
- **Test Audit**: 22 tests, 90% coverage thresholds, CI solid, 6 modules untested
- **MCP SDK**: Resources/Prompts use registerResource/registerPrompt pattern, Streamable HTTP single /mcp endpoint
- **Sampling/Roots**: Client capabilities — server only receives roots notifications and can request sampling from client

### Metis Review
**Identified Gaps** (addressed):
- Sampling/Roots client capability'ler — sunucu tarafında handler/helper olarak hafif implemente edilecek
- zod → peer dependency yapılmalı (versiyon çakışması riski)
- Resources/Prompts → transport layer'da implemente, ApplicationRuntime'da değil
- Tüm generic parametrelere default type zorunlu
- loadConfig() generic yapılmalı ama basit case bozulmamalı
- security.features → Record<string, boolean> olacak (typed yerine)
- bin/cli.js shebang → tsup config'de handle edilecek
- MCPBASE_ env prefix → consumer'lar kendi prefix'lerini kullanabilmeli
- Hook throw davranışı tanımlanmalı (pre-hook throw → tool çalışmaz)
- Config key collision stratejisi belirlenmeli (base key'ler reserved)

---

## Work Objectives

### Core Objective
mcpbase'i fork-template'den generic, npm-publishable base library'ye dönüştürmek. Derived MCP sunucuları `npm install @vaur94/mcpbase` ile tüm altyapıyı inherit edecek — tip güvenli, genişletilebilir, test edilmiş.

### Concrete Deliverables
- `src/contracts/` — Generic type definitions (BaseRuntimeConfig, BaseToolExecutionContext, ToolDefinition generics)
- `src/core/` — Generic AppError<TCode>, result types exported
- `src/application/` — Generic ApplicationRuntime<TConfig,TContext>, ToolRegistry<TContext>, execution hooks
- `src/config/` — Generic loadConfig<TConfig>, config schema factory
- `src/capabilities/` — YENİ: Resource, Prompt, Logging, Sampling, Roots abstractions
- `src/transport/` — Streamable HTTP adapter, transport factory
- `src/index.ts` — Tam export barrel (tüm public API)
- `src/examples/index.ts` — Subpath export for example tools
- `src/security/index.ts` — Subpath export for security guards
- `package.json` — exports field, peer deps, v2.0.0
- `docs/en/migration/v1-to-v2.md` — Migration guide
- `tests/` — TDD test suite for all new code

### Definition of Done
- [ ] `npm run ci:check` passes (format + lint + typecheck + test:coverage + build)
- [ ] `npm pack --dry-run` shows correct exports structure
- [ ] Generic type consumer test: derived config/context/error compile without error
- [ ] All 6 MCP capabilities have registration abstractions
- [ ] Streamable HTTP transport functional (verified with MCP client)
- [ ] Hook system functional (pre/post/error hooks fire correctly)
- [ ] All existing tests updated for generic types
- [ ] Coverage thresholds maintained (90%/90%/80%/90%)
- [ ] Zero `as any`, `@ts-ignore`, empty catch blocks

### Must Have
- Tüm generic parametreler default type'a sahip (breaking change yok simple case için)
- Config factory: `createRuntimeConfigSchema(extension)` çalışıyor
- Hook system: beforeExecute/afterExecute/onError
- Resources/Prompts registration in transport layer
- Streamable HTTP + Stdio dual transport
- Complete export barrel (Logger, ToolExecutionContext, result types, schemas, utilities)
- TDD: her task'ta test-first approach
- Migration guide

### Must NOT Have (Guardrails)
- ❌ Plugin/DI mimarisi — hook sistemi yeterli, overengineering yapma
- ❌ SSE transport — deprecated, dahil etme
- ❌ Built-in HTTP server (Express/Fastify) — sadece transport adapter, server consumer'ın sorumluluğu
- ❌ Lifecycle hooks (onStart/onStop) BU FAZDA — sadece execution hooks (beforeExecute/afterExecute/onError)
- ❌ `as any`, `@ts-ignore`, `@ts-expect-error` — YASAK
- ❌ Boş catch blokları — YASAK
- ❌ 3'ten fazla subpath export — sadece main, examples, security
- ❌ Logger interface değişikliği — mevcut Logger interface korunacak
- ❌ Sampling/Roots için ağır abstraction — hafif helper/handler yeterli
- ❌ Config key collision — base key'ler (server, logging) reserved, consumer key'ler TExtras'ta
- ❌ Mevcut stdio transport'u bozma — Streamable HTTP EKLEME, stdio KORUMA
- ❌ mcp-contextops veya mcp-fileops kodu — bu plan sadece mcpbase

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (Vitest)
- **Automated tests**: TDD — test first, implementation second
- **Framework**: Vitest (mevcut)
- **Each task follows**: RED (failing test) → GREEN (minimal impl) → REFACTOR

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Type system**: Use Bash (tsc --noEmit) — Compile generic types, assert no errors
- **Runtime behavior**: Use Bash (vitest run) — Execute tests, assert pass
- **Package output**: Use Bash (npm pack --dry-run) — Verify exports structure
- **Transport**: Use Bash (node script) — Start server, send MCP request, verify response
- **Protocol**: Use Bash (vitest run tests/protocol/) — Full MCP client/server test

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation — generic types + contracts, MAX PARALLEL):
├── Task 1: Generic BaseRuntimeConfig<TExtras> + config schema factory [deep]
├── Task 2: Generic AppError<TCode> + BaseAppErrorCode [quick]
├── Task 3: Generic BaseToolExecutionContext<TConfig> [quick]
├── Task 4: Generic ToolDefinition<I,O,TContext> + ToolAnnotations [quick]
├── Task 5: Generic ToolRegistry<TContext> [quick]
├── Task 6: Export completeness — barrel all types + utilities [quick]
└── Task 7: Package.json restructure (peer deps, exports field, v2.0.0) [quick]

Wave 2 (Core Modules — generic runtime + hooks + config):
├── Task 8: Generic ApplicationRuntime<TConfig,TContext> + options constructor (depends: 1,2,3,4,5) [deep]
├── Task 9: Execution hooks system (depends: 8) [deep]
├── Task 10: Generic loadConfig<TConfig>(schema, argv) (depends: 1) [unspecified-high]
└── Task 11: Generic bootstrap<TConfig,TContext>(options) (depends: 8,9,10) [deep]

Wave 3 (MCP Capabilities — NEW features):
├── Task 12: Resource registration abstraction + contract (depends: 8) [deep]
├── Task 13: Prompt registration abstraction + contract (depends: 8) [deep]
├── Task 14: MCP Logging capability — 8-level bridge (depends: 8) [unspecified-high]
├── Task 15: Sampling client helper (depends: 8) [quick]
└── Task 16: Roots notification handler (depends: 8) [quick]

Wave 4 (Transport + Packaging):
├── Task 17: Streamable HTTP transport adapter (depends: 12,13,14) [deep]
├── Task 18: Transport factory — config-driven selection (depends: 17) [unspecified-high]
├── Task 19: Subpath exports — examples + security (depends: 6,7) [quick]
└── Task 20: createMcpServer refactor — wire all capabilities (depends: 12,13,14,15,16,18) [deep]

Wave 5 (Docs + Final Quality):
├── Task 21: Update all existing tests for generic types (depends: 8,9,10,11) [unspecified-high]
├── Task 22: Protocol test update — full MCP capability verification (depends: 20) [deep]
├── Task 23: Migration guide v1 → v2 (depends: ALL) [writing]
└── Task 24: API documentation generation (depends: ALL) [writing]

Wave FINAL (After ALL tasks — independent review, 4 parallel):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)

Critical Path: Task 1 → Task 8 → Task 9 → Task 11 → Task 20 → Task 22 → FINAL
Parallel Speedup: ~65% faster than sequential
Max Concurrent: 7 (Wave 1)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | — | 8, 10 | 1 |
| 2 | — | 8 | 1 |
| 3 | — | 8 | 1 |
| 4 | — | 8 | 1 |
| 5 | — | 8 | 1 |
| 6 | — | 19 | 1 |
| 7 | — | 19 | 1 |
| 8 | 1,2,3,4,5 | 9,11,12,13,14,15,16 | 2 |
| 9 | 8 | 11 | 2 |
| 10 | 1 | 11 | 2 |
| 11 | 8,9,10 | 22 | 2 |
| 12 | 8 | 17,20 | 3 |
| 13 | 8 | 17,20 | 3 |
| 14 | 8 | 17,20 | 3 |
| 15 | 8 | 20 | 3 |
| 16 | 8 | 20 | 3 |
| 17 | 12,13,14 | 18,20 | 4 |
| 18 | 17 | 20 | 4 |
| 19 | 6,7 | — | 4 |
| 20 | 12,13,14,15,16,18 | 22 | 4 |
| 21 | 8,9,10,11 | — | 5 |
| 22 | 20 | — | 5 |
| 23 | ALL | — | 5 |
| 24 | ALL | — | 5 |

### Agent Dispatch Summary

- **Wave 1**: **7 tasks** — T1→`deep`, T2-T5→`quick`, T6-T7→`quick`
- **Wave 2**: **4 tasks** — T8→`deep`, T9→`deep`, T10→`unspecified-high`, T11→`deep`
- **Wave 3**: **5 tasks** — T12-T13→`deep`, T14→`unspecified-high`, T15-T16→`quick`
- **Wave 4**: **4 tasks** — T17→`deep`, T18→`unspecified-high`, T19→`quick`, T20→`deep`
- **Wave 5**: **4 tasks** — T21→`unspecified-high`, T22→`deep`, T23-T24→`writing`
- **FINAL**: **4 tasks** — F1→`oracle`, F2→`unspecified-high`, F3→`unspecified-high`, F4→`deep`

---

## TODOs

- [ ] 1. Generic BaseRuntimeConfig\<TExtras\> + Config Schema Factory

  **What to do**:
  - RED: Write tests for generic config schema behavior:
    - `baseRuntimeConfigSchema` validates only `server` + `logging` (security removed from base)
    - `createRuntimeConfigSchema(extensionSchema)` merges base + extension
    - `createPartialRuntimeConfigSchema(extensionSchema)` creates partial version for loadConfig
    - `BaseRuntimeConfig<TExtras>` type with default `TExtras = Record<string, never>`
    - Extension example: `createRuntimeConfigSchema(z.object({ storage: storageSchema }))` → validates server + logging + storage
    - `security.features` → `Record<string, boolean>` (artık typed değil)
  - GREEN: Implement in `src/contracts/runtime-config.ts`:
    - Export `baseServerSchema`, `baseLoggingSchema`, `baseRuntimeConfigSchema`
    - Export `createRuntimeConfigSchema<TExtras>(extensionSchema: ZodObject<TExtras>)` factory
    - Export `createPartialRuntimeConfigSchema<TExtras>(extensionSchema)` factory
    - Export `BaseRuntimeConfig<TExtras>` type via `z.infer`
    - Remove hardcoded `security` section from base schema (move to security subpath)
  - REFACTOR: Clean up, ensure all Zod schemas export corresponding TypeScript types
  - Update `src/config/default-config.ts` → export `baseDefaultConfig` (only server + logging defaults)

  **Must NOT do**:
  - Security schema'yı base'de tutma — subpath export'a taşınacak
  - Hardcoded feature flags (serverInfoTool, textTransformTool) base'de bırakma
  - Default type'sız generic parametre tanımlama

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Core type system refactoring, Zod schema factory pattern requires careful generic type design
  - **Skills**: []
    - No external skills needed — pure TypeScript + Zod work
  - **Skills Evaluated but Omitted**:
    - `playwright`: No UI work
    - `git-master`: Standard git operations sufficient

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4, 5, 6, 7)
  - **Blocks**: Tasks 8, 10
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `src/contracts/runtime-config.ts` — Mevcut runtimeConfigSchema ve tüm Zod tanımları. BU DOSYA tamamen refactor edilecek. Mevcut yapıyı anla, sonra generic'e dönüştür.
  - `src/config/default-config.ts` — Mevcut defaultConfig sabiti. server + logging kısmı korunacak, security kısmı çıkarılacak.

  **API/Type References**:
  - `src/contracts/runtime-config.ts:RuntimeConfig` — Mevcut type. Generic `BaseRuntimeConfig<TExtras>` olacak.
  - `src/contracts/runtime-config.ts:logLevelSchema` — Korunacak, export edilecek.
  - `src/contracts/runtime-config.ts:partialRuntimeConfigSchema` — Generic factory'ye dönüşecek.

  **Test References**:
  - `tests/unit/config-loader.test.ts` — Mevcut config test pattern'ı. Yeni testler bu yapıyı takip etmeli.
  - `tests/fixtures/runtime-config.ts:createFixtureConfig()` — Bu fixture generic'e uyarlanmalı.

  **External References**:
  - Zod v4 docs: `z.object().extend()` ve `z.intersection()` pattern'ları — generic schema composition için

  **Acceptance Criteria**:

  - [ ] Test file created: `tests/unit/runtime-config.test.ts`
  - [ ] `vitest run tests/unit/runtime-config.test.ts` → PASS (tüm schema factory testleri)
  - [ ] `tsc --noEmit` → zero errors with generic config types
  - [ ] `BaseRuntimeConfig<{storage: {path: string}}>` compiles correctly

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Base schema validates server + logging only (no security)
    Tool: Bash (vitest)
    Preconditions: Tests written, implementation complete
    Steps:
      1. Run `npx vitest run tests/unit/runtime-config.test.ts`
      2. Assert test "baseRuntimeConfigSchema sadece server ve logging doğrular" passes
      3. Assert test "security alanı base schema'da reddedilir" passes
    Expected Result: All config schema tests PASS
    Failure Indicators: Any test FAIL, or security field accepted by base schema
    Evidence: .sisyphus/evidence/task-1-base-schema-validation.txt

  Scenario: Config factory creates valid extended schema
    Tool: Bash (vitest)
    Preconditions: Factory function implemented
    Steps:
      1. Run `npx vitest run tests/unit/runtime-config.test.ts --reporter=verbose`
      2. Assert test "createRuntimeConfigSchema extension ile çalışır" passes
      3. Assert extended schema validates base + extension fields
      4. Assert extended schema rejects unknown fields
    Expected Result: Factory creates correct merged schema
    Failure Indicators: Extended schema doesn't validate extension fields, or accepts invalid fields
    Evidence: .sisyphus/evidence/task-1-config-factory.txt

  Scenario: Generic type compiles with custom TExtras
    Tool: Bash (tsc)
    Preconditions: Types exported from index.ts
    Steps:
      1. Create temp file with: `import type { BaseRuntimeConfig } from './src/index.js'; type MyConfig = BaseRuntimeConfig<{storage: {path: string}}>; const _check: MyConfig = {} as any;`
      2. Run `npx tsc --noEmit --strict` on temp file
      3. Assert zero type errors
    Expected Result: Generic type parameter works correctly
    Failure Indicators: TypeScript compilation error
    Evidence: .sisyphus/evidence/task-1-generic-type-check.txt
  ```

  **Commit**: YES
  - Message: `refactor(config): make RuntimeConfig generic with TExtras parameter`
  - Files: `src/contracts/runtime-config.ts`, `src/config/default-config.ts`, `tests/unit/runtime-config.test.ts`, `tests/fixtures/runtime-config.ts`
  - Pre-commit: `npx vitest run tests/unit/runtime-config.test.ts`

- [ ] 2. Generic AppError\<TCode\> + BaseAppErrorCode

  **What to do**:
  - RED: Write tests for generic error system:
    - `BaseAppErrorCode` union type = 'CONFIG_ERROR' | 'VALIDATION_ERROR' | 'TOOL_NOT_FOUND' | 'TOOL_EXECUTION_ERROR'
    - 'PERMISSION_DENIED' → security subpath'e taşınacak (base'den çıkarılacak)
    - `AppError<TCode extends string = BaseAppErrorCode>` generic class
    - Consumer extension: `type MyErrorCode = BaseAppErrorCode | 'STORAGE_ERROR' | 'MEMORY_ERROR'`
    - `new AppError<MyErrorCode>('STORAGE_ERROR', ...)` compiles
    - `ensureAppError()` generic version
  - GREEN: Implement in `src/core/app-error.ts`:
    - Export `BaseAppErrorCode` type
    - Make `AppError` class generic: `AppError<TCode extends string = BaseAppErrorCode>`
    - Update `ensureAppError<TCode>()` to be generic
    - Export all types
  - REFACTOR: Ensure backward compatibility — `AppError` without type param works as before

  **Must NOT do**:
  - 'PERMISSION_DENIED' base'de tutma — security concern, subpath'e taşınacak
  - Default type parametresi olmadan bırakma — `AppError` (no generic) eski gibi çalışmalı

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single file modification, straightforward generic addition
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - None needed — simple type refactoring

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4, 5, 6, 7)
  - **Blocks**: Task 8
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/core/app-error.ts` — Mevcut AppError class ve AppErrorCode union. Class'ı generic yap, BaseAppErrorCode export et.

  **Test References**:
  - `tests/unit/error-and-file.test.ts` — Mevcut error testleri. Mevcut testler kırılmamalı + yeni generic testler eklenmeli.

  **Acceptance Criteria**:

  - [ ] Test file updated: `tests/unit/error-and-file.test.ts` (veya yeni `tests/unit/app-error.test.ts`)
  - [ ] `vitest run tests/unit/app-error.test.ts` → PASS
  - [ ] `AppError` without type param still works (backward compat)
  - [ ] `AppError<BaseAppErrorCode | 'CUSTOM'>` compiles

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Generic AppError accepts custom error codes
    Tool: Bash (vitest)
    Preconditions: Generic AppError implemented
    Steps:
      1. Run `npx vitest run tests/unit/app-error.test.ts --reporter=verbose`
      2. Assert test "AppError<CustomCode> custom hata kodu kabul eder" passes
      3. Assert test "AppError default BaseAppErrorCode ile çalışır" passes
      4. Assert test "ensureAppError generic versiyonu çalışır" passes
    Expected Result: All error tests PASS
    Failure Indicators: Generic type doesn't accept custom codes, or default breaks
    Evidence: .sisyphus/evidence/task-2-generic-error.txt

  Scenario: BaseAppErrorCode excludes PERMISSION_DENIED
    Tool: Bash (tsc)
    Preconditions: PERMISSION_DENIED removed from base
    Steps:
      1. Write test: `const err = new AppError('PERMISSION_DENIED', ...)` → should type error
      2. Run `npx tsc --noEmit`
      3. Assert compilation error for PERMISSION_DENIED in base AppError
    Expected Result: PERMISSION_DENIED not assignable to BaseAppErrorCode
    Failure Indicators: No type error — PERMISSION_DENIED still in base
    Evidence: .sisyphus/evidence/task-2-permission-denied-removed.txt
  ```

  **Commit**: YES
  - Message: `refactor(error): make AppError generic with TCode parameter`
  - Files: `src/core/app-error.ts`, `tests/unit/app-error.test.ts`
  - Pre-commit: `npx vitest run tests/unit/app-error.test.ts`

- [ ] 3. Generic BaseToolExecutionContext\<TConfig\>

  **What to do**:
  - RED: Write tests for generic execution context:
    - `BaseToolExecutionContext<TConfig extends BaseRuntimeConfig = BaseRuntimeConfig>` interface
    - Base fields: `requestId`, `toolName`, `config` (generic TConfig)
    - Consumer extension: `interface MyContext extends BaseToolExecutionContext<MyConfig> { storage: StorageManager }`
    - Type inference: context.config → TConfig type
  - GREEN: Modify `src/core/execution-context.ts`:
    - Make `ToolExecutionContext` → `BaseToolExecutionContext<TConfig>`
    - Keep backward compat alias: `type ToolExecutionContext = BaseToolExecutionContext`
    - Export both names
  - REFACTOR: Ensure all internal usages compile

  **Must NOT do**:
  - Mevcut `ToolExecutionContext` adını tamamen kaldırma — alias olarak kalsın
  - config field'ı opsiyonel yapma — zorunlu kalmalı

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single interface modification, straightforward generic
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4, 5, 6, 7)
  - **Blocks**: Task 8
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/core/execution-context.ts` — Mevcut ToolExecutionContext interface. 3 field: requestId, toolName, config. Generic TConfig parametresi eklenecek.

  **API/Type References**:
  - `src/contracts/runtime-config.ts:RuntimeConfig` — config field'ın mevcut tipi. Generic'e dönüşecek.

  **Acceptance Criteria**:

  - [ ] `BaseToolExecutionContext<MyConfig>` compiles with extended config
  - [ ] `ToolExecutionContext` alias still works (backward compat)
  - [ ] `tsc --noEmit` → zero errors

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Generic context accepts extended config type
    Tool: Bash (tsc)
    Preconditions: Generic context implemented
    Steps:
      1. Write type check: `interface MyCtx extends BaseToolExecutionContext<{server: {name: string; version: string}; logging: {level: 'info'; includeTimestamp: boolean}; storage: {path: string}}> { storage: {path: string} }`
      2. Run `npx tsc --noEmit`
      3. Assert zero type errors
    Expected Result: Extended context compiles correctly
    Failure Indicators: Type error on extension
    Evidence: .sisyphus/evidence/task-3-generic-context.txt

  Scenario: Backward compatibility alias works
    Tool: Bash (vitest)
    Preconditions: Alias exported
    Steps:
      1. Run existing tests that use ToolExecutionContext
      2. Assert all pass without modification
    Expected Result: No breaking changes for existing code
    Failure Indicators: Existing tests fail
    Evidence: .sisyphus/evidence/task-3-backward-compat.txt
  ```

  **Commit**: YES
  - Message: `refactor(context): make ToolExecutionContext generic with TConfig parameter`
  - Files: `src/core/execution-context.ts`, `tests/unit/execution-context.test.ts`
  - Pre-commit: `npx vitest run tests/unit/execution-context.test.ts`

- [ ] 4. Generic ToolDefinition\<TInput, TOutput, TContext\> + ToolAnnotations

  **What to do**:
  - RED: Write tests for generic tool contract:
    - `ToolDefinition<TInput, TOutput, TContext extends BaseToolExecutionContext = BaseToolExecutionContext>` — TContext parametresi eklendi
    - `execute(input: TInput, context: TContext)` signature — context artık generic
    - `ToolAnnotations` interface export (mcp-fileops pattern'ından)
    - `ToolSecurityDefinition` → security subpath'e taşınacak
    - `ToolSuccessPayload`, `ToolInputSchema`, `ToolOutputSchema` export
  - GREEN: Modify `src/contracts/tool-contract.ts`:
    - Add TContext generic parameter with default
    - Export ToolAnnotations interface
    - Move ToolSecurityDefinition to separate file (security subpath)
    - Export all sub-types
  - REFACTOR: Ensure existing tool definitions compile without changes (default TContext)

  **Must NOT do**:
  - ToolSecurityDefinition base contract'ta tutma — security subpath'e
  - Mevcut tool tanımlarını kırma — default generics sayesinde çalışmalı

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Interface modification with generic addition
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 5, 6, 7)
  - **Blocks**: Task 8
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/contracts/tool-contract.ts` — Mevcut ToolDefinition interface. TContext parametresi eklenecek, ToolSecurityDefinition ayrılacak.
  - `src/application/example-tools.ts` — Tool tanım pattern'ı. Bu dosyadaki tool'lar mevcut interface ile çalışmaya devam etmeli.

  **External References**:
  - MCP SDK: `@modelcontextprotocol/sdk` — McpServer.tool() registration pattern'ı, ToolAnnotations shape

  **Acceptance Criteria**:

  - [ ] Test file: `tests/unit/tool-contract.test.ts`
  - [ ] `vitest run tests/unit/tool-contract.test.ts` → PASS
  - [ ] Mevcut example-tools.ts TİP HATASIZ compile olmalı (default TContext)
  - [ ] ToolAnnotations type export edilmeli

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: ToolDefinition with custom TContext compiles
    Tool: Bash (tsc)
    Preconditions: Generic ToolDefinition implemented
    Steps:
      1. Write tool definition: `const tool: ToolDefinition<typeof schema, typeof outputSchema, MyContext> = { ... execute(input, ctx) { ctx.storage; } }`
      2. Run `npx tsc --noEmit`
      3. Assert context parameter has custom type
    Expected Result: Custom context accessible in execute function
    Failure Indicators: Type error on custom context field access
    Evidence: .sisyphus/evidence/task-4-generic-tool-def.txt

  Scenario: Existing tool definitions compile without changes
    Tool: Bash (tsc)
    Preconditions: Default TContext works
    Steps:
      1. Run `npx tsc --noEmit` on entire project
      2. Assert example-tools.ts compiles without modification
    Expected Result: Zero type errors in existing code
    Failure Indicators: Any type error in example-tools.ts
    Evidence: .sisyphus/evidence/task-4-backward-compat.txt
  ```

  **Commit**: YES
  - Message: `refactor(tool): make ToolDefinition generic with TContext parameter`
  - Files: `src/contracts/tool-contract.ts`, `tests/unit/tool-contract.test.ts`
  - Pre-commit: `npx vitest run tests/unit/tool-contract.test.ts`

- [ ] 5. Generic ToolRegistry\<TContext\>

  **What to do**:
  - RED: Write tests for generic registry:
    - `ToolRegistry<TContext extends BaseToolExecutionContext = BaseToolExecutionContext>` class
    - `register(tool: ToolDefinition<any, any, TContext>)` — typed tool registration
    - `get(name)` returns `ToolDefinition<any, any, TContext> | undefined`
    - `getAll()` returns array with correct TContext
  - GREEN: Modify `src/application/tool-registry.ts`:
    - Add TContext generic parameter
    - Update register/get/getAll signatures
  - REFACTOR: Ensure ApplicationRuntime integration compiles

  **Must NOT do**:
  - Registry API'yi değiştirme (register/get/getAll) — sadece generic ekle

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single class generic addition
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 4, 6, 7)
  - **Blocks**: Task 8
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/application/tool-registry.ts` — Mevcut ToolRegistry class. TContext generic eklenmeli.

  **Test References**:
  - `tests/unit/tool-registry.test.ts` — 3 mevcut test. Güncellenmeli + generic testler eklenmeli.

  **Acceptance Criteria**:

  - [ ] `tests/unit/tool-registry.test.ts` updated + PASS
  - [ ] `ToolRegistry<MyContext>` sadece `ToolDefinition<any, any, MyContext>` tool'ları kabul etmeli

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Generic registry accepts correctly typed tools
    Tool: Bash (vitest)
    Preconditions: Generic ToolRegistry implemented
    Steps:
      1. Run `npx vitest run tests/unit/tool-registry.test.ts --reporter=verbose`
      2. Assert "ToolRegistry<TContext> doğru tipli tool kaydeder" passes
      3. Assert "get() doğru TContext ile döner" passes
    Expected Result: Registry maintains type safety
    Failure Indicators: Type mismatch in registration or retrieval
    Evidence: .sisyphus/evidence/task-5-generic-registry.txt
  ```

  **Commit**: YES
  - Message: `refactor(registry): make ToolRegistry generic with TContext parameter`
  - Files: `src/application/tool-registry.ts`, `tests/unit/tool-registry.test.ts`
  - Pre-commit: `npx vitest run tests/unit/tool-registry.test.ts`

- [ ] 6. Export Completeness — Barrel All Types + Utilities

  **What to do**:
  - `src/index.ts` barrel export'u genişlet — tüm public API'yi dışa aç:
    - **Types**: `BaseRuntimeConfig`, `BaseToolExecutionContext`, `ToolExecutionContext` (alias), `BaseAppErrorCode`, `ToolAnnotations`, `ToolSuccessPayload`, `ToolInputSchema`, `ToolOutputSchema`, `TextContentBlock`, `SuccessResult`, `ErrorResult`
    - **Interfaces**: `Logger`, `LogLevel`, `LogEntry`
    - **Zod Schemas**: `baseRuntimeConfigSchema`, `logLevelSchema`, `createRuntimeConfigSchema`, `createPartialRuntimeConfigSchema`
    - **Utilities**: `deepMerge`, `createRequestId`, `sanitizeMessage`, `createTextContent`
    - **Classes**: `ApplicationRuntime`, `StderrLogger`, `AppError`, `ToolRegistry`
    - **Functions**: `bootstrap`, `loadConfig`, `createMcpServer`, `startStdioServer`
    - **Constants**: `baseDefaultConfig`
  - Verify `import type` is used for type-only exports (ESLint rule)
  - Ensure NO internal implementation details leak

  **Must NOT do**:
  - Internal helpers export etme (örn: parseCliArgs internals)
  - Circular dependency oluşturma
  - `verbatimModuleSyntax` kuralını ihlal etme

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Barrel export file modification
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 4, 5, 7)
  - **Blocks**: Task 19
  - **Blocked By**: None (diğer Wave 1 task'ları ile paralel çalışır ama son halini onlardan sonra görecek)

  **References**:

  **Pattern References**:
  - `src/index.ts` — Mevcut barrel. Eksik export'lar eklenmeli.

  **Acceptance Criteria**:

  - [ ] `tsc --noEmit` → zero errors
  - [ ] `import { Logger, BaseRuntimeConfig, deepMerge, ... } from './src/index.js'` compiles
  - [ ] No circular dependency warnings

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: All public types importable from barrel
    Tool: Bash (tsc)
    Preconditions: Barrel updated
    Steps:
      1. Create temp consumer file importing ALL exported symbols
      2. Run `npx tsc --noEmit`
      3. Assert zero type errors
    Expected Result: All symbols accessible from single import
    Failure Indicators: Any import resolution error
    Evidence: .sisyphus/evidence/task-6-barrel-imports.txt

  Scenario: No internal leaks in barrel
    Tool: Bash (grep)
    Preconditions: Barrel file written
    Steps:
      1. Check src/index.ts does NOT export parseCliArgs, readJsonFile, or other internal functions
      2. Assert only public API symbols are exported
    Expected Result: Clean public API surface
    Failure Indicators: Internal implementation details exported
    Evidence: .sisyphus/evidence/task-6-no-internal-leaks.txt
  ```

  **Commit**: YES
  - Message: `refactor(exports): barrel all missing types and utilities from index.ts`
  - Files: `src/index.ts`
  - Pre-commit: `npx tsc --noEmit`

- [ ] 7. Package.json Restructure — Peer Deps, Exports Field, v2.0.0

  **What to do**:
  - `package.json` güncelle:
    - `version` → `2.0.0`
    - `zod` → `dependencies`'den `peerDependencies`'e taşı (`"zod": ">=3.23.0 || >=4.0.0"`)
    - `@modelcontextprotocol/sdk` → peer dep olarak da ekle
    - `exports` field ekle/güncelle:
      ```json
      {
        ".": { "import": "./dist/index.js", "types": "./dist/index.d.ts" },
        "./examples": { "import": "./dist/examples/index.js", "types": "./dist/examples/index.d.ts" },
        "./security": { "import": "./dist/security/index.js", "types": "./dist/security/index.d.ts" }
      }
      ```
    - `files` array güncelle: `["dist", "README.md", "LICENSE", "CHANGELOG.md"]`
  - `tsup.config.ts` güncelle:
    - Entry points: `['src/index.ts', 'src/examples/index.ts', 'src/security/index.ts']`
    - Ensure separate output bundles for subpath exports
  - `src/examples/index.ts` oluştur (placeholder — Task 19'da doldurulacak)
  - `src/security/index.ts` oluştur (placeholder — Task 19'da doldurulacak)

  **Must NOT do**:
  - 3'ten fazla subpath export — main + examples + security yeterli
  - zod'u bundle etme — peer dep olarak bırak
  - Mevcut bin/cli.js entry point'u kaldırma

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Configuration file modifications
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1-6)
  - **Blocks**: Task 19
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `package.json` — Mevcut config. exports, peerDependencies eklenecek, version bump.
  - `tsup.config.ts` — Mevcut build config. Multi-entry point desteği eklenecek.

  **Acceptance Criteria**:

  - [ ] `npm pack --dry-run` shows correct file structure
  - [ ] `npm run build` produces dist/index.js + dist/examples/index.js + dist/security/index.js
  - [ ] version = 2.0.0

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Package exports resolve correctly
    Tool: Bash (npm)
    Preconditions: package.json updated, build complete
    Steps:
      1. Run `npm run build`
      2. Run `npm pack --dry-run`
      3. Assert dist/index.js, dist/examples/index.js, dist/security/index.js exist in output
      4. Assert package version is 2.0.0
    Expected Result: All 3 entry points built and packaged
    Failure Indicators: Missing entry points or wrong version
    Evidence: .sisyphus/evidence/task-7-package-exports.txt

  Scenario: Peer dependencies correctly declared
    Tool: Bash (node)
    Preconditions: package.json updated
    Steps:
      1. Read package.json peerDependencies
      2. Assert zod is in peerDependencies (not dependencies)
      3. Assert @modelcontextprotocol/sdk is in peerDependencies
    Expected Result: Both are peer deps
    Failure Indicators: zod still in dependencies
    Evidence: .sisyphus/evidence/task-7-peer-deps.txt
  ```

  **Commit**: YES
  - Message: `build(package): restructure exports, peer deps, bump to v2.0.0`
  - Files: `package.json`, `tsup.config.ts`, `src/examples/index.ts`, `src/security/index.ts`
  - Pre-commit: `npm run build`

- [ ] 8. Generic ApplicationRuntime\<TConfig, TContext\> + Options Constructor

  **What to do**:
  - RED: Write comprehensive tests for generic runtime:
    - `ApplicationRuntime<TConfig extends BaseRuntimeConfig = BaseRuntimeConfig, TContext extends BaseToolExecutionContext<TConfig> = BaseToolExecutionContext<TConfig>>` class
    - Options-based constructor (mcp-fileops pattern'ından):
      ```typescript
      interface RuntimeOptions<TConfig, TContext> {
        config: TConfig;
        logger: Logger;
        tools: ToolDefinition<any, any, TContext>[];
        contextFactory?: (toolName: string, requestId: string) => TContext;
      }
      ```
    - `contextFactory` opsiyonel — default: `{ requestId, toolName, config }` base context oluşturur
    - Consumers override `contextFactory` to add custom fields (e.g., storage)
    - `executeTool(name, rawInput)` → mevcut akış korunacak ama generic context kullanacak
    - Security check → runtime'dan çıkarılacak (hook'larla yapılabilir), hardcoded assertFeatureEnabled kaldır
  - GREEN: Refactor `src/application/runtime.ts`:
    - Positional args → options object
    - Generic TConfig + TContext
    - contextFactory injection
    - Remove hardcoded security assertions (push to hook system — Task 9)
  - REFACTOR: Ensure all internal callers compile

  **Must NOT do**:
  - Positional constructor'ı koruma — options pattern'a geç
  - Security check'i base runtime'da bırakma — hook system sorumluluğu olacak
  - contextFactory'yi zorunlu yapma — default davranış olmalı

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Core runtime refactoring, multiple concerns (generics + constructor + context factory + security removal)
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 9, 11, 12, 13, 14, 15, 16
  - **Blocked By**: Tasks 1, 2, 3, 4, 5 (all generic types)

  **References**:

  **Pattern References**:
  - `src/application/runtime.ts` — Mevcut ApplicationRuntime. Tamamen refactor edilecek: positional → options, concrete → generic.
  - `src/core/execution-context.ts` — Context oluşturma pattern'ı. contextFactory bu interface'i implement edecek.

  **API/Type References**:
  - Tasks 1-5'in output'ları: `BaseRuntimeConfig`, `AppError`, `BaseToolExecutionContext`, `ToolDefinition`, `ToolRegistry` — hepsi generic

  **Test References**:
  - `tests/unit/runtime-normalization.test.ts` — Mevcut runtime test. Generic'e uyarlanmalı.
  - `tests/integration/runtime.test.ts` — Integration test. Tam pipeline testi.

  **Acceptance Criteria**:

  - [ ] Test file: `tests/unit/runtime.test.ts` (expanded)
  - [ ] `vitest run tests/unit/runtime.test.ts` → PASS
  - [ ] `vitest run tests/integration/runtime.test.ts` → PASS (updated)
  - [ ] Options constructor works: `new ApplicationRuntime({ config, logger, tools })`
  - [ ] contextFactory injection works: custom context fields accessible in tool.execute()
  - [ ] No hardcoded security assertions in runtime

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Options-based constructor works
    Tool: Bash (vitest)
    Preconditions: Runtime refactored
    Steps:
      1. Run `npx vitest run tests/unit/runtime.test.ts --reporter=verbose`
      2. Assert "RuntimeOptions ile oluşturma çalışır" passes
      3. Assert "contextFactory ile özel context oluşturur" passes
    Expected Result: Options constructor and context factory work
    Failure Indicators: Constructor rejects options object
    Evidence: .sisyphus/evidence/task-8-options-constructor.txt

  Scenario: Generic runtime with custom types compiles
    Tool: Bash (tsc)
    Preconditions: Generic runtime implemented
    Steps:
      1. Write: `new ApplicationRuntime<MyConfig, MyContext>({ config: myConfig, logger, tools: myTools, contextFactory: (name, id) => ({ requestId: id, toolName: name, config: myConfig, storage: myStorage }) })`
      2. Run `npx tsc --noEmit`
      3. Assert zero type errors
    Expected Result: Full generic parameterization compiles
    Failure Indicators: Type inference failure
    Evidence: .sisyphus/evidence/task-8-generic-runtime.txt

  Scenario: Security assertions removed from base runtime
    Tool: Bash (grep)
    Preconditions: Security removed
    Steps:
      1. Search src/application/runtime.ts for "assertFeatureEnabled"
      2. Assert NOT found
    Expected Result: No hardcoded security in runtime
    Failure Indicators: assertFeatureEnabled still called in runtime
    Evidence: .sisyphus/evidence/task-8-no-security-in-runtime.txt
  ```

  **Commit**: YES
  - Message: `refactor(runtime): make ApplicationRuntime generic with options constructor`
  - Files: `src/application/runtime.ts`, `tests/unit/runtime.test.ts`, `tests/integration/runtime.test.ts`
  - Pre-commit: `npx vitest run tests/unit/runtime.test.ts && npx vitest run tests/integration/runtime.test.ts`

- [ ] 9. Execution Hooks System (beforeExecute / afterExecute / onError)

  **What to do**:
  - RED: Write tests for hook system:
    - `ExecutionHooks<TContext>` interface:
      ```typescript
      interface ExecutionHooks<TContext extends BaseToolExecutionContext = BaseToolExecutionContext> {
        beforeExecute?: (tool: ToolDefinition<any, any, TContext>, input: unknown, context: TContext) => Promise<void> | void;
        afterExecute?: (tool: ToolDefinition<any, any, TContext>, input: unknown, result: ToolSuccessPayload, context: TContext) => Promise<void> | void;
        onError?: (tool: ToolDefinition<any, any, TContext>, input: unknown, error: AppError, context: TContext) => Promise<void> | void;
      }
      ```
    - Hook'lar RuntimeOptions'a eklenmeli: `hooks?: ExecutionHooks<TContext>`
    - **beforeExecute throw → tool çalışmaz, error döner** (Metis guardrail)
    - **afterExecute throw → log + result yine döner** (result kaybolmaz)
    - **onError throw → log, orijinal error döner** (swallow edilmez)
    - Multiple hooks: array support (`hooks?: ExecutionHooks<TContext>[]`)
    - Hooks sıralı çalışır (async serial)
  - GREEN: Implement hook execution in `src/application/runtime.ts`:
    - `executeTool()` flow: beforeExecute → execute → afterExecute (success) veya onError (failure)
    - Export `ExecutionHooks` interface from contracts
  - REFACTOR: Security check artık hook olarak implement edilebilir (example'da göster)

  **Must NOT do**:
  - Lifecycle hooks (onStart/onStop) bu fazda ekleme — sadece execution hooks
  - Hook throw'da tool execution'ı sessizce yutma — açık hata davranışı
  - Parallel hook execution — serial olacak

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: New feature with complex error handling semantics and async flow
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Task 8)
  - **Parallel Group**: Wave 2 (sequential after Task 8)
  - **Blocks**: Task 11
  - **Blocked By**: Task 8

  **References**:

  **Pattern References**:
  - `src/application/runtime.ts:executeTool()` — Hook'ların entegre edileceği flow. Task 8'den sonraki hali baz alınacak.

  **External References**:
  - Express middleware pattern — serial async execution model referansı
  - Fastify hooks — onRequest/preHandler/onResponse lifecycle referansı

  **Acceptance Criteria**:

  - [ ] Test file: `tests/unit/hooks.test.ts`
  - [ ] `vitest run tests/unit/hooks.test.ts` → PASS
  - [ ] beforeExecute throw → tool NOT executed, error returned
  - [ ] afterExecute throw → result still returned, error logged
  - [ ] onError throw → original error returned, hook error logged
  - [ ] Multiple hooks execute in order (array)

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Hook lifecycle executes correctly
    Tool: Bash (vitest)
    Preconditions: Hook system implemented
    Steps:
      1. Run `npx vitest run tests/unit/hooks.test.ts --reporter=verbose`
      2. Assert "beforeExecute hook tool öncesi çalışır" passes
      3. Assert "afterExecute hook başarılı sonuç sonrası çalışır" passes
      4. Assert "onError hook hata durumunda çalışır" passes
      5. Assert "çoklu hook'lar sıralı çalışır" passes
    Expected Result: All hook lifecycle tests PASS
    Failure Indicators: Hook not called, wrong order, or wrong timing
    Evidence: .sisyphus/evidence/task-9-hook-lifecycle.txt

  Scenario: beforeExecute throw prevents tool execution
    Tool: Bash (vitest)
    Preconditions: Error handling implemented
    Steps:
      1. Run test "beforeExecute fırlatırsa tool çalışmaz"
      2. Assert tool.execute() was NOT called
      3. Assert error result returned to caller
    Expected Result: Tool blocked, error propagated
    Failure Indicators: Tool still executes after hook throw
    Evidence: .sisyphus/evidence/task-9-before-hook-throw.txt
  ```

  **Commit**: YES
  - Message: `feat(hooks): add execution hooks system (before/after/error)`
  - Files: `src/contracts/hooks.ts`, `src/application/runtime.ts`, `tests/unit/hooks.test.ts`
  - Pre-commit: `npx vitest run tests/unit/hooks.test.ts`

- [ ] 10. Generic loadConfig\<TConfig\>(schema, argv) + CLI Args Refactor

  **What to do**:
  - RED: Write tests for generic config loading:
    - `loadConfig<TConfig extends BaseRuntimeConfig>(schema: ZodSchema<TConfig>, argv?: string[]): Promise<TConfig>` — generic signature
    - 4-layer system korunmalı: default → file → env → CLI
    - Env prefix configurable: default `MCPBASE_` ama consumer kendi prefix'ini geçebilmeli
    - Config file path: default `mcpbase.config.json` ama override edilebilir
    - `loadConfig(baseRuntimeConfigSchema)` → eski gibi çalışmalı (backward compat)
    - `loadConfig(createRuntimeConfigSchema(storageExtension))` → extended config yükler
  - GREEN: Refactor `src/config/load-config.ts`:
    - Accept schema parameter instead of hardcoded runtimeConfigSchema
    - Accept options: `{ envPrefix?: string; defaultConfigFile?: string }`
    - Keep 4-layer merge logic
  - Also refactor `src/infrastructure/cli-args.ts` if needed for generic support

  **Must NOT do**:
  - 4-layer config sistemini değiştirme — korunacak
  - Simple case'i bozma — `loadConfig(baseRuntimeConfigSchema)` parametre geçirmeden çalışabilmeli
  - Env parsing'de hardcoded MCPBASE_ prefix bırakma — configurable olmalı

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Config system refactoring with multiple concerns (generic, env prefix, file path)
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (alongside Task 9, after Task 1)
  - **Parallel Group**: Wave 2 (parallel with Task 9, after Task 8 completes)
  - **Blocks**: Task 11
  - **Blocked By**: Task 1 (config schema)

  **References**:

  **Pattern References**:
  - `src/config/load-config.ts` — Mevcut loadConfig. 4-layer merge + schema validation. Generic'e dönüştürülecek.
  - `src/config/default-config.ts` — Default values. Task 1'de güncellenen hali kullanılacak.
  - `src/infrastructure/cli-args.ts` — CLI argument parsing. Generic config ile uyumlu olmalı.

  **Test References**:
  - `tests/unit/config-loader.test.ts` — 2 mevcut test. Generic versiyona uyarlanmalı + extension testleri eklenmeli.

  **Acceptance Criteria**:

  - [ ] `tests/unit/config-loader.test.ts` updated + PASS
  - [ ] `loadConfig(baseRuntimeConfigSchema)` works without breaking
  - [ ] `loadConfig(extendedSchema, { envPrefix: 'MYAPP_' })` works
  - [ ] 4-layer merge tested with extended config

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Generic loadConfig loads extended schema
    Tool: Bash (vitest)
    Preconditions: Generic loadConfig implemented
    Steps:
      1. Run `npx vitest run tests/unit/config-loader.test.ts --reporter=verbose`
      2. Assert "generic loadConfig extended schema ile çalışır" passes
      3. Assert "4 katmanlı merge korunmuş" passes
      4. Assert "custom env prefix çalışır" passes
    Expected Result: Generic config loading works
    Failure Indicators: Schema validation fails for extended config
    Evidence: .sisyphus/evidence/task-10-generic-config.txt

  Scenario: Default (no-args) loadConfig still works
    Tool: Bash (vitest)
    Preconditions: Backward compat maintained
    Steps:
      1. Run test "loadConfig varsayılan schema ile çalışır"
      2. Assert base config loaded correctly
    Expected Result: No regression
    Failure Indicators: loadConfig requires new parameters
    Evidence: .sisyphus/evidence/task-10-backward-compat.txt
  ```

  **Commit**: YES
  - Message: `refactor(config): make loadConfig generic with schema parameter`
  - Files: `src/config/load-config.ts`, `src/infrastructure/cli-args.ts`, `tests/unit/config-loader.test.ts`
  - Pre-commit: `npx vitest run tests/unit/config-loader.test.ts`

- [ ] 11. Generic bootstrap\<TConfig, TContext\>(options) Refactor

  **What to do**:
  - RED: Write tests for generic bootstrap:
    - `BootstrapOptions<TConfig, TContext>` interface:
      ```typescript
      interface BootstrapOptions<TConfig extends BaseRuntimeConfig = BaseRuntimeConfig, TContext extends BaseToolExecutionContext<TConfig> = BaseToolExecutionContext<TConfig>> {
        configSchema?: ZodSchema<TConfig>;
        tools: ToolDefinition<any, any, TContext>[] | (() => ToolDefinition<any, any, TContext>[]);
        loggerFactory?: (config: TConfig) => Logger;
        contextFactory?: (toolName: string, requestId: string, config: TConfig) => TContext;
        hooks?: ExecutionHooks<TContext> | ExecutionHooks<TContext>[];
        transport?: 'stdio' | 'streamable-http' | TransportConfig;
        argv?: string[];
      }
      ```
    - `bootstrap()` without args → mevcut gibi çalışır (example tools + stdio)
    - `bootstrap(options)` → full customization
    - Simple case: `bootstrap({ tools: myTools })` — sadece tool geçir, geri kalan default
  - GREEN: Refactor `src/index.ts:bootstrap()`:
    - Accept BootstrapOptions
    - Use generic ApplicationRuntime internally
    - Default loggerFactory → StderrLogger
    - Default transport → stdio
    - Wire hooks if provided
  - REFACTOR: Ensure bin/cli.js still works

  **Must NOT do**:
  - `bootstrap()` parametresiz çağrıyı kırma — backward compat
  - Transport seçimini bu task'ta implement etme — placeholder olarak stdio kullan, Task 18'de gerçek factory gelecek
  - bin/cli.js'i kaldırma veya değiştirme

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Main entry point refactoring with multiple integration points
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (after Tasks 8, 9, 10)
  - **Blocks**: Task 22
  - **Blocked By**: Tasks 8, 9, 10

  **References**:

  **Pattern References**:
  - `src/index.ts:bootstrap()` — Mevcut bootstrap. Black box'tan options-based'e dönüştürülecek.
  - `bin/cli.js` — CLI entry point. bootstrap() çağırır, bozulmamalı.

  **API/Type References**:
  - Task 8: `RuntimeOptions` — bootstrap içinde kullanılacak
  - Task 9: `ExecutionHooks` — bootstrap options'a eklenecek
  - Task 10: `loadConfig` generic — bootstrap config yükleme için

  **Acceptance Criteria**:

  - [ ] Test file: `tests/unit/bootstrap.test.ts`
  - [ ] `vitest run tests/unit/bootstrap.test.ts` → PASS
  - [ ] `bootstrap()` without args still works
  - [ ] `bootstrap({ tools: myTools })` works
  - [ ] `bootstrap({ tools, hooks, configSchema })` works

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Bootstrap with options works
    Tool: Bash (vitest)
    Preconditions: Bootstrap refactored
    Steps:
      1. Run `npx vitest run tests/unit/bootstrap.test.ts --reporter=verbose`
      2. Assert "BootstrapOptions ile başlatma çalışır" passes
      3. Assert "sadece tools geçirildiğinde default'lar kullanılır" passes
    Expected Result: Options-based bootstrap functional
    Failure Indicators: Options rejected or defaults not applied
    Evidence: .sisyphus/evidence/task-11-bootstrap-options.txt

  Scenario: Backward compatible bootstrap
    Tool: Bash (vitest)
    Preconditions: Default behavior preserved
    Steps:
      1. Run test "parametresiz bootstrap eski gibi çalışır"
      2. Assert example tools loaded, stdio transport used
    Expected Result: Zero regression
    Failure Indicators: bootstrap() without args fails
    Evidence: .sisyphus/evidence/task-11-backward-compat.txt
  ```

  **Commit**: YES
  - Message: `refactor(bootstrap): make bootstrap generic with options pattern`
  - Files: `src/index.ts`, `tests/unit/bootstrap.test.ts`
  - Pre-commit: `npx vitest run tests/unit/bootstrap.test.ts`

- [ ] 12. Resource Registration Abstraction + Contract

  **What to do**:
  - RED: Write tests for resource registration:
    - `ResourceDefinition` interface:
      ```typescript
      interface ResourceDefinition {
        uri: string;
        name: string;
        description?: string;
        mimeType?: string;
        handler: (uri: URL) => Promise<ResourceContent>;
      }
      ```
    - `ResourceTemplate` support (dynamic URI templates like `file://{path}`):
      ```typescript
      interface ResourceTemplateDefinition {
        uriTemplate: string;
        name: string;
        description?: string;
        mimeType?: string;
        list?: () => Promise<ResourceListEntry[]>;
        handler: (uri: URL, params: Record<string, string>) => Promise<ResourceContent>;
      }
      ```
    - `ResourceContent` type: `{ uri: string; text?: string; blob?: string; mimeType?: string }`
    - `ResourceRegistry` class — static + template resources yönetimi
  - GREEN: Create `src/capabilities/resources.ts`:
    - Export ResourceDefinition, ResourceTemplateDefinition, ResourceContent, ResourceListEntry
    - Implement ResourceRegistry (register, get, list, read)
  - Note: Transport layer integration (MCP protocol wiring) Task 20'de yapılacak

  **Must NOT do**:
  - MCP protocol wiring (registerResource in McpServer) — bu Task 20'nin sorumluluğu
  - File system resource implementation — sadece abstraction, concrete impl consumer'ın işi
  - Ağır abstraction — SDK'nın pattern'ını takip et

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: New capability design, registry pattern, URI template handling
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 13, 14, 15, 16)
  - **Blocks**: Tasks 17, 20
  - **Blocked By**: Task 8

  **References**:

  **External References**:
  - MCP SDK: `McpServer.registerResource()` — registration pattern. mcpbase abstraction bu pattern'ı sarmallamalı.
  - MCP SDK: `ResourceTemplate` class — URI template handling pattern
  - MCP Spec: Resources capability — `resources/list`, `resources/read`, `resources/subscribe` endpoints

  **Acceptance Criteria**:

  - [ ] Test file: `tests/unit/resources.test.ts`
  - [ ] `vitest run tests/unit/resources.test.ts` → PASS
  - [ ] ResourceDefinition + ResourceTemplateDefinition types exported
  - [ ] ResourceRegistry.register(), .get(), .list(), .read() functional

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Static resource registration and retrieval
    Tool: Bash (vitest)
    Preconditions: Resource registry implemented
    Steps:
      1. Run `npx vitest run tests/unit/resources.test.ts --reporter=verbose`
      2. Assert "statik resource kaydı ve okuma çalışır" passes
      3. Assert "list tüm resource'ları döner" passes
    Expected Result: Static resource CRUD works
    Failure Indicators: Resource not found after registration
    Evidence: .sisyphus/evidence/task-12-static-resources.txt

  Scenario: Template resource with URI parameters
    Tool: Bash (vitest)
    Preconditions: Template support implemented
    Steps:
      1. Run test "URI template parametreleri doğru parse edilir"
      2. Assert handler receives correct params from URI
    Expected Result: Template URI parameters extracted correctly
    Failure Indicators: Params undefined or wrong values
    Evidence: .sisyphus/evidence/task-12-template-resources.txt
  ```

  **Commit**: YES
  - Message: `feat(capabilities): add Resource registration abstraction`
  - Files: `src/capabilities/resources.ts`, `tests/unit/resources.test.ts`
  - Pre-commit: `npx vitest run tests/unit/resources.test.ts`

- [ ] 13. Prompt Registration Abstraction + Contract

  **What to do**:
  - RED: Write tests for prompt registration:
    - `PromptDefinition` interface:
      ```typescript
      interface PromptDefinition {
        name: string;
        description?: string;
        arguments?: PromptArgument[];
        handler: (args: Record<string, string>) => Promise<PromptMessage[]>;
      }
      interface PromptArgument {
        name: string;
        description?: string;
        required?: boolean;
      }
      interface PromptMessage {
        role: 'user' | 'assistant';
        content: TextContent | ImageContent | EmbeddedResource;
      }
      ```
    - `PromptRegistry` class — prompt yönetimi
  - GREEN: Create `src/capabilities/prompts.ts`:
    - Export PromptDefinition, PromptArgument, PromptMessage
    - Implement PromptRegistry (register, get, list)
  - Transport wiring → Task 20

  **Must NOT do**:
  - MCP protocol wiring — Task 20
  - Complex content types beyond text — keep simple initially

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: New capability design with argument validation
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 12, 14, 15, 16)
  - **Blocks**: Tasks 17, 20
  - **Blocked By**: Task 8

  **References**:

  **External References**:
  - MCP SDK: `McpServer.registerPrompt()` — registration pattern
  - MCP Spec: Prompts capability — `prompts/list`, `prompts/get` endpoints

  **Acceptance Criteria**:

  - [ ] Test file: `tests/unit/prompts.test.ts`
  - [ ] `vitest run tests/unit/prompts.test.ts` → PASS
  - [ ] PromptRegistry.register(), .get(), .list() functional

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Prompt registration and retrieval
    Tool: Bash (vitest)
    Preconditions: Prompt registry implemented
    Steps:
      1. Run `npx vitest run tests/unit/prompts.test.ts --reporter=verbose`
      2. Assert "prompt kaydı ve getirme çalışır" passes
      3. Assert "argument doğrulaması çalışır" passes
    Expected Result: Prompt CRUD works with argument validation
    Failure Indicators: Missing required arg not caught, or prompt not found
    Evidence: .sisyphus/evidence/task-13-prompts.txt
  ```

  **Commit**: YES
  - Message: `feat(capabilities): add Prompt registration abstraction`
  - Files: `src/capabilities/prompts.ts`, `tests/unit/prompts.test.ts`
  - Pre-commit: `npx vitest run tests/unit/prompts.test.ts`

- [ ] 14. MCP Logging Capability — 8-Level Bridge

  **What to do**:
  - RED: Write tests for MCP logging bridge:
    - MCP spec 8 log levels: `debug`, `info`, `notice`, `warning`, `error`, `critical`, `alert`, `emergency`
    - Application logger 4 levels: `debug`, `info`, `warn`, `error`
    - Level mapping: MCP→Application + Application→MCP
    - `McpLoggingCapability` class:
      ```typescript
      class McpLoggingCapability {
        setLevel(level: McpLogLevel): void;
        log(level: McpLogLevel, data: unknown, logger?: string): void;
        // MCP server integration will be wired in Task 20
      }
      ```
    - Mapping: notice→info, warning→warn, critical/alert/emergency→error
  - GREEN: Create `src/capabilities/logging.ts`:
    - Export McpLogLevel, McpLoggingCapability, level mapping
  - Transport wiring → Task 20

  **Must NOT do**:
  - Logger interface'i değiştirme — köprü kuracağız, mevcut Logger bozulmayacak
  - MCP protocol wiring — Task 20

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Level mapping logic + bridge pattern between two systems
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 12, 13, 15, 16)
  - **Blocks**: Tasks 17, 20
  - **Blocked By**: Task 8

  **References**:

  **Pattern References**:
  - `src/logging/logger.ts` — Mevcut Logger interface ve LogLevel. Bozulmayacak.
  - `src/logging/stderr-logger.ts` — StderrLogger. MCP logging bu alongside çalışacak.

  **External References**:
  - MCP Spec: Logging capability — `logging/setLevel` + `notifications/message` endpoints
  - MCP SDK: Server logging integration pattern

  **Acceptance Criteria**:

  - [ ] Test file: `tests/unit/mcp-logging.test.ts`
  - [ ] `vitest run tests/unit/mcp-logging.test.ts` → PASS
  - [ ] 8 MCP levels correctly mapped to 4 app levels
  - [ ] McpLoggingCapability.log() works

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Log level mapping is correct
    Tool: Bash (vitest)
    Preconditions: Level mapping implemented
    Steps:
      1. Run `npx vitest run tests/unit/mcp-logging.test.ts --reporter=verbose`
      2. Assert all 8 MCP levels map to correct 4 app levels
      3. Assert "notice → info", "warning → warn", "critical → error" mappings
    Expected Result: All level mappings correct
    Failure Indicators: Wrong level mapping
    Evidence: .sisyphus/evidence/task-14-level-mapping.txt
  ```

  **Commit**: YES
  - Message: `feat(capabilities): add MCP Logging capability bridge`
  - Files: `src/capabilities/logging.ts`, `tests/unit/mcp-logging.test.ts`
  - Pre-commit: `npx vitest run tests/unit/mcp-logging.test.ts`

- [ ] 15. Sampling Client Helper

  **What to do**:
  - RED: Write tests for sampling helper:
    - Sampling = sunucu, istemciden LLM tamamlama ister (client capability)
    - `SamplingHelper` class (lightweight wrapper):
      ```typescript
      interface SamplingRequest {
        messages: SamplingMessage[];
        modelPreferences?: ModelPreferences;
        systemPrompt?: string;
        maxTokens: number;
      }
      interface SamplingHelper {
        createSamplingRequest(messages: SamplingMessage[], options?: SamplingOptions): SamplingRequest;
        // Actual execution wired in Task 20 via McpServer
      }
      ```
    - Message types: `SamplingMessage { role: 'user' | 'assistant'; content: TextContent | ImageContent }`
  - GREEN: Create `src/capabilities/sampling.ts`:
    - Export types + helper factory
  - Note: Hafif abstraction — sadece type'lar ve request builder

  **Must NOT do**:
  - Ağır abstraction — sampling çoğu sunucu için gerekmez, hafif helper yeterli
  - Client-side implementation — sunucu sadece request oluşturur

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Lightweight type definitions + simple helper
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 12, 13, 14, 16)
  - **Blocks**: Task 20
  - **Blocked By**: Task 8

  **References**:

  **External References**:
  - MCP Spec: Sampling capability — `sampling/createMessage` endpoint
  - MCP SDK: Client sampling request pattern

  **Acceptance Criteria**:

  - [ ] Test file: `tests/unit/sampling.test.ts`
  - [ ] Types exported: SamplingRequest, SamplingMessage, SamplingHelper
  - [ ] createSamplingRequest() builds valid request object

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Sampling request builder works
    Tool: Bash (vitest)
    Preconditions: Helper implemented
    Steps:
      1. Run `npx vitest run tests/unit/sampling.test.ts`
      2. Assert "sampling request oluşturma çalışır" passes
    Expected Result: Valid sampling request created
    Failure Indicators: Request missing required fields
    Evidence: .sisyphus/evidence/task-15-sampling.txt
  ```

  **Commit**: YES (grouped with Task 16)
  - Message: `feat(capabilities): add Sampling client helper`
  - Files: `src/capabilities/sampling.ts`, `tests/unit/sampling.test.ts`
  - Pre-commit: `npx vitest run tests/unit/sampling.test.ts`

- [ ] 16. Roots Notification Handler

  **What to do**:
  - RED: Write tests for roots handler:
    - Roots = istemci, sunucuya workspace root'larını bildirir (client capability)
    - `RootsHandler` class (lightweight):
      ```typescript
      interface Root {
        uri: string;
        name?: string;
      }
      interface RootsHandler {
        getRoots(): Root[];
        onRootsChanged(callback: (roots: Root[]) => void): void;
        // Wired to notifications/rootsChanged in Task 20
      }
      ```
    - Root'lar immutable — sadece istemci güncelleyebilir
  - GREEN: Create `src/capabilities/roots.ts`:
    - Export Root, RootsHandler types + implementation
  - Note: Hafif — sadece state tutma + notification callback

  **Must NOT do**:
  - Root'ları sunucu tarafından değiştirmeye izin verme — sadece istemci bildirir
  - Dosya sistemi işlemleri — sadece URI yönetimi

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple state management + callback
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 12, 13, 14, 15)
  - **Blocks**: Task 20
  - **Blocked By**: Task 8

  **References**:

  **External References**:
  - MCP Spec: Roots capability — `roots/list` + `notifications/rootsChanged`

  **Acceptance Criteria**:

  - [ ] Test file: `tests/unit/roots.test.ts`
  - [ ] Types exported: Root, RootsHandler
  - [ ] RootsHandler.getRoots() returns current roots
  - [ ] RootsHandler.onRootsChanged() fires on update

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Roots handler tracks state and notifies
    Tool: Bash (vitest)
    Preconditions: Handler implemented
    Steps:
      1. Run `npx vitest run tests/unit/roots.test.ts`
      2. Assert "roots güncellemesi doğru state tutar" passes
      3. Assert "onRootsChanged callback çalışır" passes
    Expected Result: State management + callbacks work
    Failure Indicators: Stale state or callback not fired
    Evidence: .sisyphus/evidence/task-16-roots.txt
  ```

  **Commit**: YES (grouped with Task 15)
  - Message: `feat(capabilities): add Roots notification handler`
  - Files: `src/capabilities/roots.ts`, `tests/unit/roots.test.ts`
  - Pre-commit: `npx vitest run tests/unit/roots.test.ts`

- [ ] 17. Streamable HTTP Transport Adapter

  **What to do**:
  - RED: Write tests for HTTP transport:
    - `StreamableHttpTransportAdapter` — SDK'nın `StreamableHTTPServerTransport`'unu saran adapter
    - Consumer'ın HTTP server'ı (Express, Hono, native http) ile entegre olabilmeli
    - mcpbase built-in HTTP server OLUŞTURMAZ — sadece request handler sağlar:
      ```typescript
      interface StreamableHttpAdapter {
        handleRequest(req: IncomingMessage, res: ServerResponse, body: unknown): Promise<void>;
        sessionId?: string;
      }
      function createStreamableHttpAdapter(server: McpServer, options?: HttpAdapterOptions): StreamableHttpAdapter;
      ```
    - Session management: `sessionIdGenerator` configurable
    - Stateless per-request model (MCP Streamable HTTP spec)
  - GREEN: Create `src/transport/http/streamable-http.ts`:
    - Wrap SDK's StreamableHTTPServerTransport
    - Export adapter factory + types
  - REFACTOR: Ensure clean integration point for Task 18 (transport factory)

  **Must NOT do**:
  - Built-in HTTP server (Express/Fastify/Hono) oluşturma — sadece adapter
  - SSE transport — deprecated
  - Session state management beyond what SDK provides

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Transport layer, SDK integration, HTTP request handling
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (needs Wave 3 outputs)
  - **Parallel Group**: Wave 4
  - **Blocks**: Tasks 18, 20
  - **Blocked By**: Tasks 12, 13, 14

  **References**:

  **Pattern References**:
  - `src/transport/mcp/server.ts` — Mevcut stdio transport. Aynı pattern'da HTTP adapter oluşturulacak.

  **External References**:
  - MCP SDK: `StreamableHTTPServerTransport` — SDK'nın built-in transport class'ı
  - MCP Spec: Streamable HTTP transport — single `/mcp` endpoint, stateless per request

  **Acceptance Criteria**:

  - [ ] Test file: `tests/unit/streamable-http.test.ts`
  - [ ] `vitest run tests/unit/streamable-http.test.ts` → PASS
  - [ ] `createStreamableHttpAdapter(server)` returns valid adapter
  - [ ] handleRequest processes MCP JSON-RPC requests

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: HTTP adapter handles MCP request
    Tool: Bash (vitest)
    Preconditions: Adapter implemented
    Steps:
      1. Run `npx vitest run tests/unit/streamable-http.test.ts --reporter=verbose`
      2. Assert "HTTP adapter MCP isteğini işler" passes
      3. Assert "session ID üretilir" passes
    Expected Result: Adapter processes requests correctly
    Failure Indicators: Request not handled or invalid response format
    Evidence: .sisyphus/evidence/task-17-http-adapter.txt

  Scenario: No built-in HTTP server created
    Tool: Bash (grep)
    Preconditions: Adapter implemented
    Steps:
      1. Search src/transport/http/ for "createServer", "app.listen", "express()"
      2. Assert NONE found
    Expected Result: No server creation — only adapter
    Failure Indicators: HTTP server instantiated in transport code
    Evidence: .sisyphus/evidence/task-17-no-builtin-server.txt
  ```

  **Commit**: YES
  - Message: `feat(transport): add Streamable HTTP transport adapter`
  - Files: `src/transport/http/streamable-http.ts`, `tests/unit/streamable-http.test.ts`
  - Pre-commit: `npx vitest run tests/unit/streamable-http.test.ts`

- [ ] 18. Transport Factory — Config-Driven Selection

  **What to do**:
  - RED: Write tests for transport factory:
    - `TransportConfig` type:
      ```typescript
      type TransportConfig =
        | { type: 'stdio' }
        | { type: 'streamable-http'; port?: number; endpoint?: string; sessionIdGenerator?: () => string };
      ```
    - `createTransport(server: McpServer, config: TransportConfig)` factory function
    - Default: `{ type: 'stdio' }`
    - TransportConfig → BootstrapOptions.transport'a entegre edilecek
  - GREEN: Create `src/transport/factory.ts`:
    - Export TransportConfig, createTransport
    - Route to stdio or HTTP adapter based on config

  **Must NOT do**:
  - SSE transport seçeneği ekleme — deprecated
  - Default'u HTTP yapma — stdio default kalmalı

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Factory pattern wiring two transports
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (needs Task 17)
  - **Parallel Group**: Wave 4 (after Task 17)
  - **Blocks**: Task 20
  - **Blocked By**: Task 17

  **References**:

  **Pattern References**:
  - `src/transport/mcp/server.ts` — Mevcut stdio setup. Factory bu + HTTP adapter'ı seçecek.
  - Task 17 output: `createStreamableHttpAdapter` — Factory HTTP seçildiğinde bunu kullanacak.

  **Acceptance Criteria**:

  - [ ] Test file: `tests/unit/transport-factory.test.ts`
  - [ ] `vitest run tests/unit/transport-factory.test.ts` → PASS
  - [ ] `createTransport(server, { type: 'stdio' })` works
  - [ ] `createTransport(server, { type: 'streamable-http' })` works

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Factory selects correct transport
    Tool: Bash (vitest)
    Preconditions: Factory implemented
    Steps:
      1. Run `npx vitest run tests/unit/transport-factory.test.ts --reporter=verbose`
      2. Assert "stdio config → StdioServerTransport" passes
      3. Assert "streamable-http config → StreamableHttpAdapter" passes
      4. Assert "default config → stdio" passes
    Expected Result: Correct transport created per config
    Failure Indicators: Wrong transport type selected
    Evidence: .sisyphus/evidence/task-18-transport-factory.txt
  ```

  **Commit**: YES
  - Message: `feat(transport): add config-driven transport factory`
  - Files: `src/transport/factory.ts`, `tests/unit/transport-factory.test.ts`
  - Pre-commit: `npx vitest run tests/unit/transport-factory.test.ts`

- [ ] 19. Subpath Exports — Examples + Security

  **What to do**:
  - `src/examples/index.ts` — Example tools taşı:
    - `createExampleTools()` → buraya taşı (src/application/example-tools.ts'den)
    - `server_info` ve `text_transform` tool tanımları
    - Security-specific tool definitions (ToolSecurityDefinition)
    - Export: `createExampleTools`, individual tool definitions
  - `src/security/index.ts` — Security guards taşı:
    - `assertFeatureEnabled`, `assertAllowedCommand`, `assertAllowedPath` → buraya taşı
    - `ToolSecurityDefinition` type
    - `PERMISSION_DENIED` error code
    - Security-specific config schema (features, commands, paths)
    - Export: all security functions + types
  - Ana barrel'dan (`src/index.ts`) example ve security export'larını kaldır
  - `tsup.config.ts` entry points güncelle (Task 7'de yapılan placeholder'ları doldur)

  **Must NOT do**:
  - Example tool'ları ana barrel'dan export etmeye devam etme — subpath'e taşınmalı
  - Security guard'ları silme — sadece taşı

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: File reorganization, move operations
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (alongside Tasks 17, 18)
  - **Parallel Group**: Wave 4
  - **Blocks**: None
  - **Blocked By**: Tasks 6, 7

  **References**:

  **Pattern References**:
  - `src/application/example-tools.ts` — Taşınacak dosya
  - `src/security/guards.ts` — Taşınacak dosya

  **Acceptance Criteria**:

  - [ ] `import { createExampleTools } from '@vaur94/mcpbase/examples'` compiles
  - [ ] `import { assertFeatureEnabled } from '@vaur94/mcpbase/security'` compiles
  - [ ] Ana barrel'da example/security export'ları YOK
  - [ ] `npm run build` produces all 3 entry points

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Subpath imports resolve correctly
    Tool: Bash (tsc)
    Preconditions: Subpath exports configured
    Steps:
      1. Write consumer file: `import { createExampleTools } from './dist/examples/index.js'`
      2. Write consumer file: `import { assertFeatureEnabled } from './dist/security/index.js'`
      3. Run `npx tsc --noEmit`
      4. Assert zero errors
    Expected Result: Subpath exports resolve correctly
    Failure Indicators: Import resolution error
    Evidence: .sisyphus/evidence/task-19-subpath-imports.txt

  Scenario: Main barrel clean of examples/security
    Tool: Bash (grep)
    Preconditions: Migration complete
    Steps:
      1. Search src/index.ts for "createExampleTools", "assertFeatureEnabled", "assertAllowedCommand"
      2. Assert NONE found in main barrel
    Expected Result: Clean main barrel
    Failure Indicators: Example/security still exported from main
    Evidence: .sisyphus/evidence/task-19-clean-barrel.txt
  ```

  **Commit**: YES
  - Message: `build(exports): move examples and security to subpath exports`
  - Files: `src/examples/index.ts`, `src/security/index.ts`, `src/index.ts`, `src/application/example-tools.ts`, `src/security/guards.ts`
  - Pre-commit: `npm run build`

- [ ] 20. createMcpServer Refactor — Wire All Capabilities

  **What to do**:
  - Bu task TÜM capability'leri MCP server'a bağlar — entegrasyon noktası
  - RED: Write integration tests for full MCP server:
    - `createMcpServer(runtime, options)` generic refactor:
      ```typescript
      interface McpServerOptions<TContext> {
        resources?: ResourceRegistry;
        prompts?: PromptRegistry;
        logging?: McpLoggingCapability;
        samplingEnabled?: boolean;
        rootsEnabled?: boolean;
        transport?: TransportConfig;
      }
      ```
    - Tool registration: runtime.tools → McpServer.registerTool (mevcut, refactor)
    - Resource registration: options.resources → McpServer.registerResource (YENİ)
    - Prompt registration: options.prompts → McpServer.registerPrompt (YENİ)
    - Logging wiring: options.logging → McpServer logging handler (YENİ)
    - Sampling: declare capability if enabled (YENİ)
    - Roots: declare capability + handle notifications if enabled (YENİ)
    - Capability negotiation: server.capabilities reflects registered features
  - GREEN: Refactor `src/transport/mcp/server.ts`:
    - Accept McpServerOptions
    - Wire all registries to SDK methods
    - Handle capability advertisement correctly
  - REFACTOR: Ensure backward compat — createMcpServer(runtime) without options works (tools only)

  **Must NOT do**:
  - Capability'leri zorunlu yapma — hepsi opsiyonel
  - Transport seçimini bu dosyada yapma — Task 18'in factory'sini kullan
  - SDK'nın registration pattern'ını bypass etme — doğrudan SDK methods kullan

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Critical integration point, wires 6 capabilities to MCP SDK, complex capability negotiation
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (needs all Wave 3 + Task 18)
  - **Parallel Group**: Wave 4 (final task)
  - **Blocks**: Task 22
  - **Blocked By**: Tasks 12, 13, 14, 15, 16, 18

  **References**:

  **Pattern References**:
  - `src/transport/mcp/server.ts` — Mevcut createMcpServer + startStdioServer. Genişletilecek.

  **API/Type References**:
  - Task 12: ResourceRegistry — resource wiring
  - Task 13: PromptRegistry — prompt wiring
  - Task 14: McpLoggingCapability — logging wiring
  - Task 15: SamplingHelper — sampling capability
  - Task 16: RootsHandler — roots capability
  - Task 18: TransportConfig — transport selection

  **External References**:
  - MCP SDK: `McpServer` class — registerTool, registerResource, registerPrompt methods
  - MCP SDK: Server capabilities declaration pattern

  **Acceptance Criteria**:

  - [ ] Test file: `tests/integration/mcp-server.test.ts`
  - [ ] `vitest run tests/integration/mcp-server.test.ts` → PASS
  - [ ] createMcpServer(runtime) without options → tools only (backward compat)
  - [ ] createMcpServer(runtime, { resources, prompts, logging }) → all capabilities wired
  - [ ] Server advertises correct capabilities in initialize response

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Full capability MCP server creation
    Tool: Bash (vitest)
    Preconditions: All capabilities + transport implemented
    Steps:
      1. Run `npx vitest run tests/integration/mcp-server.test.ts --reporter=verbose`
      2. Assert "tüm capability'ler ile server oluşturma çalışır" passes
      3. Assert "capability advertisement doğru" passes
      4. Assert "resource listesi MCP üzerinden erişilebilir" passes
    Expected Result: Full MCP server with all capabilities
    Failure Indicators: Capability not advertised or registration fails
    Evidence: .sisyphus/evidence/task-20-full-mcp-server.txt

  Scenario: Backward compatible (tools only)
    Tool: Bash (vitest)
    Preconditions: Backward compat maintained
    Steps:
      1. Run test "createMcpServer(runtime) sadece tools ile çalışır"
      2. Assert only tools capability advertised
    Expected Result: No regression for tools-only usage
    Failure Indicators: Error when options not provided
    Evidence: .sisyphus/evidence/task-20-backward-compat.txt
  ```

  **Commit**: YES
  - Message: `refactor(server): wire all capabilities into createMcpServer`
  - Files: `src/transport/mcp/server.ts`, `tests/integration/mcp-server.test.ts`
  - Pre-commit: `npx vitest run tests/integration/mcp-server.test.ts`

- [ ] 21. Update All Existing Tests for Generic Types

  **What to do**:
  - Tüm mevcut test dosyalarını yeni generic API'ye uyarla:
    - `tests/unit/stderr-logger.test.ts` — Logger interface uyumluluğu
    - `tests/unit/runtime-normalization.test.ts` → `tests/unit/runtime.test.ts`'e merge veya güncelle
    - `tests/unit/security-guards.test.ts` → security subpath'ten import etmeli
    - `tests/unit/error-and-file.test.ts` — Generic AppError testleri
    - `tests/unit/cli-args.test.ts` — Muhtemelen değişmez
    - `tests/unit/tool-registry.test.ts` — Generic ToolRegistry testleri
    - `tests/unit/transport.test.ts` — createMcpServer yeni API
    - `tests/unit/config-loader.test.ts` — Generic loadConfig testleri
    - `tests/unit/example-tools.test.ts` → examples subpath'ten import
    - `tests/integration/runtime.test.ts` — Full pipeline generic test
  - Eksik modüllere test ekle:
    - `tests/unit/shared-utils.test.ts` — deepMerge, createRequestId, sanitizeMessage
    - `tests/unit/result.test.ts` — TextContentBlock, createTextContent, SuccessResult, ErrorResult
  - Fixture güncelle:
    - `tests/fixtures/runtime-config.ts:createFixtureConfig()` → generic config factory

  **Must NOT do**:
  - Mevcut test mantığını değiştirme — sadece import path'leri ve type'ları güncelle
  - Coverage threshold'ları düşürme

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multiple test files need updating, cross-cutting concern
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (alongside Tasks 22, 23, 24)
  - **Parallel Group**: Wave 5
  - **Blocks**: None
  - **Blocked By**: Tasks 8, 9, 10, 11

  **References**:

  **Test References**:
  - Tüm `tests/unit/*.test.ts` dosyaları — hepsi güncellenmeli
  - `tests/fixtures/runtime-config.ts` — Fixture güncellenmeli
  - `tests/integration/runtime.test.ts` — Integration test güncellenmeli

  **Acceptance Criteria**:

  - [ ] `npm run test:unit` → ALL PASS
  - [ ] `npm run test:coverage` → meets thresholds (90%/90%/80%/90%)
  - [ ] No test imports from old paths (e.g., `import { createExampleTools } from '../../src/application/example-tools.js'` → should be from examples subpath)
  - [ ] New tests added for shared utils and result types

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: All unit tests pass
    Tool: Bash (vitest)
    Preconditions: All tests updated
    Steps:
      1. Run `npx vitest run --reporter=verbose`
      2. Assert zero failures
      3. Assert coverage meets thresholds
    Expected Result: Full green test suite
    Failure Indicators: Any test failure or coverage drop
    Evidence: .sisyphus/evidence/task-21-all-tests-pass.txt
  ```

  **Commit**: YES
  - Message: `test: update all existing tests for generic type system`
  - Files: `tests/unit/*.test.ts`, `tests/fixtures/runtime-config.ts`, `tests/integration/runtime.test.ts`
  - Pre-commit: `npm run test:coverage`

- [ ] 22. Protocol Test Update — Full MCP Capability Verification

  **What to do**:
  - `tests/protocol/stdio.protocol.test.ts` güncelle + genişlet:
    - Mevcut testler (listTools, callTool) generic API ile çalışmalı
    - YENİ test: `resources/list` → registered resources döner
    - YENİ test: `resources/read` → resource content döner
    - YENİ test: `prompts/list` → registered prompts döner
    - YENİ test: `prompts/get` → prompt messages döner
    - YENİ test: `logging/setLevel` → log level değişir
    - YENİ test: Initialize response → all capabilities advertised correctly
    - YENİ test: Error scenarios (invalid tool, invalid resource URI)
  - Bu test gerçek stdio üzerinden çalışır (build gerektirir)

  **Must NOT do**:
  - Mock kullanma — gerçek MCP client/server communication
  - Mevcut testleri kaldırma — sadece genişlet

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Full protocol verification, real MCP client/server, complex test scenarios
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (alongside Tasks 21, 23, 24 — but needs build first)
  - **Parallel Group**: Wave 5
  - **Blocks**: None
  - **Blocked By**: Task 20

  **References**:

  **Pattern References**:
  - `tests/protocol/stdio.protocol.test.ts` — Mevcut protocol test. Real MCP client + server. Bu pattern'ı genişlet.

  **External References**:
  - MCP SDK: `@modelcontextprotocol/sdk/client` — Client API for testing

  **Acceptance Criteria**:

  - [ ] `npm run build && npm run test:protocol` → ALL PASS
  - [ ] Resources, Prompts, Logging tested over real MCP protocol
  - [ ] Capability advertisement verified in initialize handshake
  - [ ] Error scenarios tested

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Full protocol verification
    Tool: Bash (vitest)
    Preconditions: Build complete, all capabilities wired
    Steps:
      1. Run `npm run build`
      2. Run `npm run test:protocol`
      3. Assert all protocol tests pass including new capability tests
    Expected Result: Full MCP protocol compliance
    Failure Indicators: Any protocol test failure
    Evidence: .sisyphus/evidence/task-22-protocol-tests.txt

  Scenario: Capability advertisement correct
    Tool: Bash (vitest)
    Preconditions: Protocol test for initialize
    Steps:
      1. Run protocol test that checks initialize response capabilities
      2. Assert tools, resources, prompts, logging capabilities present
    Expected Result: All registered capabilities advertised
    Failure Indicators: Missing capability in initialize response
    Evidence: .sisyphus/evidence/task-22-capability-advertisement.txt
  ```

  **Commit**: YES
  - Message: `test(protocol): full MCP capability verification suite`
  - Files: `tests/protocol/stdio.protocol.test.ts`
  - Pre-commit: `npm run build && npm run test:protocol`

- [ ] 23. Migration Guide v1 → v2

  **What to do**:
  - `docs/en/migration/v1-to-v2.md` oluştur:
    - **Breaking Changes** listesi:
      - RuntimeConfig → BaseRuntimeConfig<TExtras> (security removed from base)
      - AppErrorCode → BaseAppErrorCode (PERMISSION_DENIED removed)
      - ToolExecutionContext → BaseToolExecutionContext<TConfig>
      - ApplicationRuntime positional → options constructor
      - bootstrap() → bootstrap(options)
      - loadConfig() → loadConfig(schema, argv)
      - Example tools + security → subpath exports
      - zod → peer dependency
    - **Migration Steps** (adım adım):
      1. Install v2: `npm install @vaur94/mcpbase@2`
      2. Install peer deps: `npm install zod @modelcontextprotocol/sdk`
      3. Update imports for examples/security (subpath)
      4. Update RuntimeConfig usage (add TExtras)
      5. Update ApplicationRuntime constructor (options object)
      6. Update error codes (BaseAppErrorCode + custom)
      7. Test: `npm run ci:check`
    - **Before/After** code snippets for each breaking change
    - Türkçe versiyon: `docs/migration/v1-to-v2.md`

  **Must NOT do**:
  - Incomplete migration steps — her breaking change documented olmalı
  - Sadece İngilizce — Türkçe versiyon da yazılmalı

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: Documentation writing, technical migration guide
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (alongside Tasks 21, 22, 24)
  - **Parallel Group**: Wave 5
  - **Blocks**: None
  - **Blocked By**: ALL implementation tasks (needs final API to document)

  **References**:

  **Pattern References**:
  - `docs/en/` — Mevcut docs yapısı. Migration guide bu yapıya uymalı.
  - Bu plan'ın tüm task'ları — her task'taki breaking change document edilmeli.

  **Acceptance Criteria**:

  - [ ] `docs/en/migration/v1-to-v2.md` exists
  - [ ] `docs/migration/v1-to-v2.md` exists (Türkçe)
  - [ ] Every breaking change has before/after code example
  - [ ] Step-by-step migration path complete

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Migration guide covers all breaking changes
    Tool: Bash (grep)
    Preconditions: Guide written
    Steps:
      1. Search migration guide for: "BaseRuntimeConfig", "BaseAppErrorCode", "BaseToolExecutionContext", "RuntimeOptions", "BootstrapOptions", "peerDependencies"
      2. Assert ALL terms present in guide
    Expected Result: All breaking changes documented
    Failure Indicators: Any breaking change not mentioned
    Evidence: .sisyphus/evidence/task-23-migration-completeness.txt
  ```

  **Commit**: YES
  - Message: `docs: add v1 to v2 migration guide`
  - Files: `docs/en/migration/v1-to-v2.md`, `docs/migration/v1-to-v2.md`
  - Pre-commit: None (docs only)

- [ ] 24. API Documentation Generation

  **What to do**:
  - API dokümantasyonu stratejisi seç ve uygula:
    - Option A: TypeDoc ile otomatik API docs generate et
    - Option B: Manuel API reference markdown dosyaları
    - **Recommendation**: Manuel markdown — TypeDoc setup overhead'ı çok, proje boyutu küçük
  - `docs/en/api/` dizini oluştur:
    - `docs/en/api/types.md` — Tüm exported types (BaseRuntimeConfig, AppError, ToolDefinition vb.)
    - `docs/en/api/classes.md` — ApplicationRuntime, ToolRegistry, AppError class API'leri
    - `docs/en/api/functions.md` — bootstrap, loadConfig, createMcpServer, createTextContent vb.
    - `docs/en/api/capabilities.md` — Resource, Prompt, Logging, Sampling, Roots API'leri
    - `docs/en/api/hooks.md` — ExecutionHooks interface + usage examples
  - Türkçe mirror: `docs/api/` dizini

  **Must NOT do**:
  - TypeDoc setup without team consensus — manual docs daha bakılabilir
  - Eksik public API — tüm exported symbols document edilmeli

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: Technical documentation
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (alongside Tasks 21, 22, 23)
  - **Parallel Group**: Wave 5
  - **Blocks**: None
  - **Blocked By**: ALL implementation tasks

  **References**:

  **Pattern References**:
  - `docs/en/` — Mevcut docs yapısı
  - `src/index.ts` — Final barrel export — document edilecek tüm symbols

  **Acceptance Criteria**:

  - [ ] `docs/en/api/` directory with types, classes, functions, capabilities, hooks docs
  - [ ] `docs/api/` directory (Türkçe mirror)
  - [ ] Every exported symbol has API documentation

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: All exported symbols documented
    Tool: Bash (node script)
    Preconditions: Docs written
    Steps:
      1. Extract all export names from src/index.ts
      2. Search docs/en/api/ for each symbol name
      3. Assert all symbols found in docs
    Expected Result: 100% API documentation coverage
    Failure Indicators: Symbol not found in docs
    Evidence: .sisyphus/evidence/task-24-api-docs-coverage.txt
  ```

  **Commit**: YES
  - Message: `docs: add API documentation`
  - Files: `docs/en/api/*.md`, `docs/api/*.md`
  - Pre-commit: None (docs only)

---

## Final Verification Wave

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `tsc --noEmit` + `eslint` + `vitest run --coverage`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names. Verify all generic params have defaults.
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Coverage [N%] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high`
  Start from clean state (`rm -rf node_modules dist && npm install && npm run build`). Run ALL QA scenarios from ALL tasks. Test cross-task integration: generic config + hooks + capability registration + transport. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff. Verify 1:1 — everything in spec built, nothing beyond spec. Check "Must NOT do" compliance: no plugin system, no SSE, no lifecycle hooks, no Express/Fastify. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Guardrails [N/N respected] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

Task bazlı commit'ler:
- **T1**: `refactor(config): make RuntimeConfig generic with TExtras parameter`
- **T2**: `refactor(error): make AppError generic with TCode parameter`
- **T3**: `refactor(context): make ToolExecutionContext generic with TConfig parameter`
- **T4**: `refactor(tool): make ToolDefinition generic with TContext parameter`
- **T5**: `refactor(registry): make ToolRegistry generic with TContext parameter`
- **T6**: `refactor(exports): barrel all missing types and utilities from index.ts`
- **T7**: `build(package): restructure exports, peer deps, bump to v2.0.0`
- **T8**: `refactor(runtime): make ApplicationRuntime generic with options constructor`
- **T9**: `feat(hooks): add execution hooks system (before/after/error)`
- **T10**: `refactor(config): make loadConfig generic with schema parameter`
- **T11**: `refactor(bootstrap): make bootstrap generic with options pattern`
- **T12**: `feat(capabilities): add Resource registration abstraction`
- **T13**: `feat(capabilities): add Prompt registration abstraction`
- **T14**: `feat(capabilities): add MCP Logging capability bridge`
- **T15**: `feat(capabilities): add Sampling client helper`
- **T16**: `feat(capabilities): add Roots notification handler`
- **T17**: `feat(transport): add Streamable HTTP transport adapter`
- **T18**: `feat(transport): add config-driven transport factory`
- **T19**: `build(exports): move examples and security to subpath exports`
- **T20**: `refactor(server): wire all capabilities into createMcpServer`
- **T21**: `test: update all existing tests for generic type system`
- **T22**: `test(protocol): full MCP capability verification suite`
- **T23**: `docs: add v1 to v2 migration guide`
- **T24**: `docs: add API documentation`

---

## Success Criteria

### Verification Commands
```bash
npm run ci:check                    # Expected: all pass (format, lint, typecheck, coverage, build)
npm pack --dry-run                  # Expected: correct exports (main, examples, security subpaths)
npm run test:coverage               # Expected: 90%+ lines/functions/statements, 80%+ branches
npm run test:protocol               # Expected: all protocol tests pass with new capabilities
tsc --noEmit                        # Expected: zero type errors
```

### Final Checklist
- [ ] All generic types have default parameters (simple case works without generics)
- [ ] Config factory creates valid extended schemas
- [ ] Hook system fires correctly (pre/post/error)
- [ ] Resources/Prompts register and list via MCP protocol
- [ ] Logging capability sends structured logs over MCP channel
- [ ] Sampling helper can request LLM from client
- [ ] Roots handler receives workspace roots
- [ ] Streamable HTTP transport accepts and responds to MCP requests
- [ ] Transport factory selects correct transport from config
- [ ] Subpath exports resolve correctly (import from '@vaur94/mcpbase/examples')
- [ ] zod is peer dependency (not bundled)
- [ ] Migration guide covers all breaking changes
- [ ] Zero `as any`, `@ts-ignore`, empty catches in codebase
- [ ] All "Must NOT Have" guardrails respected
