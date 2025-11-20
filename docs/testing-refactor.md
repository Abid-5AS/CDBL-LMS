### Testing refactor outline (unit → contract → e2e)

- **Unit (vitest, mocked Prisma/Redis/email)**  
  - Scope: pure functions, policy validators, date/working-days logic, balance math, RBAC guards.  
  - Location: `tests/unit/**` and `tests/lib/**`.  
  - Tooling: chai/expect, `vi.mock("@/lib/prisma")`, deterministic fakes for `Date.now`.

- **Contract/API (vitest + supertest or fetch, against seeded test DB)**  
  - Scope: API routes with Prisma hitting a disposable DB seeded via `prisma/seed.ts` + fixtures in `tests/fixtures`.  
  - Add per-feature suites: `tests/api/encashment.test.ts`, `tests/api/leaves.test.ts`, `tests/api/approvals.test.ts`.  
  - Use auth helper to sign in once per role; never rely on production creds.  
  - Spin up db via `docker-compose -f docker-compose.yml up -d db && pnpm prisma:seed:test`.

- **E2E (Playwright)**  
  - Scope: role journeys (employee, HR, CEO) that cover dashboard → request → approval → balance updates.  
  - Seed data before run; export report via `npx playwright show-report`.  
  - Keep to <10 minutes; tag long journeys and run nightly.  

- **Test data & fixtures**  
  - Introduce `tests/fixtures/users.ts` and `tests/fixtures/leaves.ts` with deterministic IDs.  
  - Provide `scripts/reset-test-db.ts` to wipe/reseed before API/E2E runs.

- **What to retire from current repo**  
  - Split `tests/backend-api.test.ts` into smaller contract suites.  
  - Avoid live creds/remote API calls; everything should hit the local seeded API.

- **CI matrix suggestions**  
  - `pnpm test:unit` on every push.  
  - `pnpm test:integration` (API/contract) on PR.  
  - `pnpm test:e2e` nightly or on release branches.  
  - Cache `.next`/`node_modules`; restore DB volume between steps if using Docker.
