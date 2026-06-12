# AGENTS.md

## Commands

```bash
npm run build              # tsc compile src/ → dist/
npm test                   # vitest (unit + integration)
npm run dev                # build + local-start (requires .env)
npm run local-start        # source .env and run dist/index.js
npm run docker-up          # docker compose up --build (DB + RabbitMQ + app)
npm run docker-down        # docker compose down -v (destroys volumes)
npm run drizzle-generate   # generate migrations from schema changes
npm run drizzle-migrate    # apply pending migrations (run after docker-up)
```

- **Startup order**: `docker-up` → `drizzle-migrate` (if fresh). Server won't start without DB + RabbitMQ.
- **No lockfile in git**: `package-lock.json` is `.gitignored`. Run `npm install` to generate it locally.
- **Requires Node.js v22+** (Docker uses `node:22-alpine`).

## Architecture

- **App/server split**: `src/app.ts` creates the Express app (no `listen()`). `src/index.ts` calls `listen()`, connects RabbitMQ, wires shutdown signals. Tests import `app` directly via supertest.
- **Layers**: `routes/` → `controllers/` → `services/` → `db/`. Schemas in `schemas/`, Zod types in `types/validation.ts`.
- **Module resolution**: `nodenext` — **all local imports must use `.js` extension** (e.g. `import { config } from './config/config.js'`).
- **Drizzle ORM**: schema at `src/db/schema.ts`, db instance at `src/db/index.ts`, migrations in `drizzle/`.
- **DRY**: abstract shared logic into `src/utils/` or middleware.
- **Download keys**: public asset retrieval uses unique, short-lived expiring keys (`asset_keys` table) to protect storage internals.

## Validation & Error Handling

- All request validation via Zod schemas in `src/schemas/`. Schemas define `body`, `query`, `params`, `cookies` keys.
- The `validate` middleware stores validated data at `req.validData`. Controllers use `ValidatedRequest<T>` type.
- **Never try-catch in controllers** for operational errors. Throw `ApiError` subclasses (from `src/utils/errors.ts`); the global `errorMiddleware` catches them.
- Use `envOrThrow` from `src/utils/env.ts` for all env var access. Config is centralized in `src/config/config.ts`.

## Workflow

- **Atomic changes**: each task should produce a single atomic change (comparable to one git commit).
- **Always verify** after changes: `npm run build` then `npm test`.
- **Update `README.md`** when changing API surface area, features, or project structure.

## Testing

- Tests use `.test.ts` suffix, co-located with source. Run with `npm test` (vitest).
- `vitest.config.ts` provides fake env vars — **no real DB or RabbitMQ needed for tests**. Unit tests mock `db` and external services with `vi.mock`.
- Integration tests (e.g. `src/app.test.ts`) import `app` and use supertest.
- TDD is mandatory per project conventions.

## Code Style

See `GEMINI.md` for the full engineering standards. Key rules:
- 4-space indentation, blank lines before/after top-level structures (if, functions, loops).
- Exported members at top of file, private/helper functions at bottom.
- Avoid `any`; use strict TypeScript.
- Minimal comments — code should be self-documenting.

## Infrastructure

- **PostgreSQL 17** (using `pg` + `drizzle-orm/node-postgres`)
- **RabbitMQ 4** (with management plugin on port 15672) — used for export jobs (`QueueName.PROJECT_EXPORTS`). The export worker starts in `src/index.ts`.
- **Content-Addressable Storage**: uploads stored under `UPLOADS_DIR` (env var). File deletion must clean up CAS to avoid orphans.
- **Auth**: JWT access tokens (stateless, short-lived) + refresh tokens (validated against `tokenVersion` column in `users` table).
