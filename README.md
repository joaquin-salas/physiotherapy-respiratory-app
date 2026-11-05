# Physiotherapy Respiratory App

Monorepo for a therapeutic exercise app for respiratory patients.

| Folder        | What                          | Tech                     |
|---------------|-------------------------------|--------------------------|
| `apps/api`    | Backend                       | NestJS + PostgreSQL (TS) |
| `apps/web`    | Physiotherapist web panel     | React + Vite (TS)        |
| `apps/mobile` | Patient app (phone / tablet)  | Flutter (Dart)           |

## Getting started

```bash
pnpm install
docker compose up -d                      # PostgreSQL on localhost:5432
cp apps/api/.env.example apps/api/.env    # first time only
pnpm dev:api   # http://localhost:3000
pnpm dev:web   # http://localhost:5173
```

The Flutter app is not part of the pnpm workspace; run it from `apps/mobile` with `flutter run`.
