# AGENTS.md

Guidance for AI coding agents working in this repository.

## The product

A therapeutic exercise platform for **respiratory patients**, starting with **lung cancer**.
Patients are mostly **over 65**. Three parts:

1. **Patient app** (Flutter, phone/tablet): today's workout, exercise videos, effort/breathlessness logging.
2. **Physiotherapist panel** (React web): exercise library, patients, programs, adherence, alerts, evolution.
3. **Data engine** (NestJS API): stores everything, computes trends, sends reminders and monthly
   questionnaires; later proposes progressions (rules first, a trained model much later).

## Domain rules (non-negotiable)

- **The physiotherapist always decides.** Rules or algorithms may only *propose* changes to a
  patient's treatment; a physio approves them. Never build anything that changes a treatment automatically.
- **Safety first.** A risky answer in the daily pre-session check (fever, chest pain, more breathlessness
  than usual) must block training and alert the physio.
- **Health data (GDPR / LOPDGDD).** Special category data: EU hosting, encryption, role-based access
  (a physio sees only their own patients; a patient sees only their own data), access logging,
  identifying data kept separate from clinical data. **Never use real patient data** in code, tests,
  seeds, logs or tools. Don't add third-party services that receive app data (telemetry, analytics)
  without asking.
- **Elderly-friendly patient UI.** One task per screen, 2–3 large buttons (≥48px) with text, font ≥18px,
  high contrast, plain everyday language ("¿Cómo de cansado se ha quedado?", not "RPE").
- Progression rules and questionnaires must be **data (editable tables/templates), not hard-coded logic**.

## Architecture

pnpm monorepo:

```
apps/api      NestJS + Prisma 7 + PostgreSQL     (TypeScript)
apps/web      React + Vite, physio panel         (TypeScript)
apps/mobile   Flutter, patient app               (Dart, not created yet, not in the pnpm workspace)
docker-compose.yml   local PostgreSQL 18
```

- **All API routes start with `/api`** (`app.setGlobalPrefix('api')`).
- The web app calls **relative URLs** (`/api/...`). Vite's dev proxy forwards them to `localhost:3000`
  (nginx will do the same in production). **No CORS**: don't enable it.
- Code is organized **by feature**, mirrored between apps: `apps/api/src/exercises/` ↔ `apps/web/src/features/exercises/`.

## Stack: one tool per job

Use these; don't add alternatives for the same job.

| Job | Tool |
|---|---|
| API framework | NestJS (modules, controllers, services, DI) |
| Request validation | DTO classes + `class-validator` (global `ValidationPipe` with `whitelist` + `forbidNonWhitelisted`) |
| Database access | Prisma 7 (`PrismaService`, global module, `@prisma/adapter-pg`) |
| Web routing | React Router v8 (data router, `createBrowserRouter`) |
| Server data in the web | TanStack Query |
| Forms | React Hook Form + Zod (`@hookform/resolvers`) |
| UI components | shadcn/ui (Radix base) + Tailwind CSS v4, icons from `lucide-react` |

## Commands (run from the repo root)

```bash
docker compose up -d                   # start PostgreSQL (Docker Desktop must be running)
pnpm dev:api                           # API on http://localhost:3000/api
pnpm dev:web                           # panel on http://localhost:5173
pnpm build | pnpm lint | pnpm test     # all apps
pnpm --filter api prisma:migrate       # after editing schema.prisma (migrate + generate)
pnpm --filter api prisma:studio        # browse the database
pnpm --filter api test:e2e             # needs the database running
```

Before finishing a task, run `pnpm build` and `pnpm lint`.

## Conventions

- **Code, comments and commits in English; UI text in Spanish** (the users are physios and patients in Spain).
  Map enum codes to Spanish labels in the frontend (e.g. `exercises.labels.ts`).
- **API modules stay simple:** `module` + `controller` (HTTP only) + `service` (logic + Prisma) + `dto/`.
  No DDD layers unless a module's logic clearly needs it. Convert Prisma "not found" errors (P2025) into `NotFoundException`.
- **Web feature folder:** `<feature>.api.ts` (types + calls via `apiClient`) → `<feature>.hooks.ts`
  (TanStack Query) → components/pages. **Only `src/lib/api-client.ts` calls `fetch`.** Invalidate
  the related query keys after mutations.
- Web API types are written by hand from the Prisma schema/DTOs. Keep them in sync.
- Add shadcn components with `pnpm dlx shadcn@latest add <name>` (run in `apps/web`); they land in `src/components/ui/`.
- Use the `@/` import alias in the web app.
- **Conventional Commits** with scopes: `feat(api): ...`, `fix(web): ...`, `chore: ...`. Commit only when asked.

## Gotchas (each of these has already cost time)

- **Prisma 7: `prisma migrate dev` does not regenerate the client.** Use `pnpm --filter api prisma:migrate`, which runs both.
- **Prisma is pinned to `7.10.1`** (exact versions). npm's `latest` tag pointed to an `8.0.0-rc`. Don't upgrade without asking.
- **Never edit `apps/api/src/generated/`.** It's the generated Prisma client (gitignored).
- **Change the database only through `schema.prisma` + a migration**, never by hand in a SQL client.
- **API imports use `.js` extensions** (`'./exercises.service.js'`). The API is ESM with `nodenext` resolution.
- **The web app has `erasableSyntaxOnly`**: no TypeScript-only syntax such as `enum`, `namespace` or
  constructor parameter properties (`constructor(public x: string)`). Use `as const` objects and explicit fields.
- **React Router v8:** import `RouterProvider` from `react-router/dom`, everything else from `react-router`.
  There is no `react-router-dom`.
- **pnpm blocks dependency install scripts.** Allowed ones are listed under `allowBuilds` in `pnpm-workspace.yaml`.
- **The API refuses to start if PostgreSQL is down** (a `SELECT 1` check in `PrismaService`). Start Docker first.
- Some initializers (`prisma init`, CLI generators) write agent/skill folders (`.claude/`, `.cursor/`, `.agents/`…)
  or telemetry setup into the repo. Remove them; don't commit them.
- `pnpm lint` shows `only-export-components` warnings in shadcn's generated `ui/` files. They're expected.

## Current status

- Done: monorepo, PostgreSQL + Prisma, `Exercise` model, exercises CRUD API, web panel with exercises table + create form.
- Not done: authentication (the API is open), patients/programs/sessions models, Flutter app, deployment.
- Known: the two starter tests for `AppController` fail (the demo endpoint was changed). Fix or remove them when touching that code.
