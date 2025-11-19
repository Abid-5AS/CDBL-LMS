# Repository Guidelines

## Project Structure & Module Organization
- `app/` hosts Next.js route handlers and pages; colocate feature-specific components under nested folders to keep server and client boundaries obvious.
- Shared UI, hooks, and state live in `components/`, `hooks/`, `context/`, and `lib/`; keep platform-agnostic helpers in `lib/` to reuse across web and mobile shells.
- Prisma schemas, migrations, and seeds are in `prisma/`; sample CSV data and QA scripts reside in `data/`, `qa/`, and `reports/`.
- Tests sit in `tests/` (unit, integration, API, job suites) with legacy playwright specs under `__tests__/`; public assets and Tailwind tokens stay in `public/` and `styles/`.

## Build, Test, and Development Commands
- `pnpm install` (or `npm install`) hydrates dependencies and runs `prisma generate` through `postinstall`.
- `pnpm dev` launches the Next.js app with Turbopack; pass `NEXT_PUBLIC_API_BASE` in `.env.local` when pointing to non-default services.
- `pnpm build` performs Prisma codegen then `next build`; ensure the database container defined in `docker-compose.yml` is up so migrations can run.
- `pnpm test:unit`, `pnpm test:integration`, and `pnpm test:e2e` cover Vitest suites and Playwright journeys respectively; use `pnpm test -- --update` when refreshing snapshots.
- `pnpm prisma:seed` (alias `pnpm seed`) hydrates demo records; `pnpm verify:demo` validates seeded HR/employee accounts before showcasing.

## Coding Style & Naming Conventions
- TypeScript + React 19 with strict mode; keep components functional and server-first unless stateful UI demands client directives.
- Prefer 2-space indentation, single quotes, and Tailwind utility-first styling; run `pnpm lint` (ESLint flat config) before pushing.
- Name hooks as `useFeature`, API routes as `route.ts`, Prisma models in PascalCase, and files in kebab-case (`app/hr/settings/page.tsx`).

## Testing Guidelines
- Vitest plus Testing Library power unit/integration coverage; place specs beside `tests/<area>` using `*.test.ts(x)`.
- Playwright scripts in `__tests__/` simulate end-to-end HR and employee flows; record failures via `npx playwright show-report`.
- Aim to cover new Prisma queries and critical leave approval logic; mock Redis and cron jobs with provided fixtures in `tests/lib`.

## Commit & Pull Request Guidelines
- Follow the short, conventional prefixes seen in history (`feat:`, `fix:`, `chore:`, `docs:`) and write imperative summaries under 72 chars.
- Each PR should describe the user-facing change, database updates, and testing evidence; link Jira/Linear tickets or GitHub issues.
- Include screenshots or terminal output for UI and CLI shifts, note schema migrations, and call out any feature flags or env var changes.

## Security & Configuration Tips
- Never commit `.env*` secrets; copy `.env.example` and set `DATABASE_URL`, `REDIS_URL`, and SMTP credentials locally.
- When testing role-based flows, refer to `USER_CREDENTIALS.md` and rotate seeded passwords via `pnpm prisma:seed` before demos.
