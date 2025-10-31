# Coding Rules and Conventions

## General

- Use **Next.js 16** app-router conventions with Turbopack.

- Use `export const cache = "no-store"` for dynamic routes; never `noStore()` or `cacheLife()` in APIs.

- Always wrap Prisma or DB fetches in **Suspense** subcomponents for server data.

- All async data code must live in components marked `"use cache"` or `"use server"` as needed.

## Styling

- Follow Tailwind's default spacing (`gap-6`, `p-6`, `rounded-xl`, `shadow-sm`).

- Dark mode ready — prefer `bg-gray-50` → `bg-gray-900`.

## File Layout

- `app/` → routes

- `components/` → reusable UI

- `hooks/` → client logic

- `tasks/` → AI task definitions

## AI Agent Etiquette

- When editing files: explain in-line what's changing and why.

- Do **not** modify `.env` values or secrets.

- Confirm before deleting any files.

