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
apps/mobile   Flutter, patient app               (Dart, not in the pnpm workspace)
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
| QR codes in the web | `qrcode.react` (drawn in the browser; never an online QR generator) |
| Drag and drop in the web | `@dnd-kit` (core + sortable + modifiers + utilities): mouse, touch (tablets) and keyboard; drag by a handle |
| Mobile HTTP | `http` package, only through `lib/core/api_client.dart` |
| Mobile token storage | `flutter_secure_storage` (Android Keystore / iOS Keychain) |
| Mobile QR scanning | `flutter_zxing` (ZXing C++ on the phone, no Google ML Kit, nothing sent anywhere), only in `scan_screen.dart` |
| Mobile state / navigation | plain `setState` + `Navigator` for now (no state-management or router package chosen yet) |

## Commands (run from the repo root)

```bash
docker compose up -d                   # start PostgreSQL (Docker Desktop must be running)
pnpm dev:api                           # API on http://localhost:3000/api
pnpm dev:web                           # panel on http://localhost:5173
pnpm build | pnpm lint | pnpm test     # all apps
pnpm --filter api prisma:migrate       # after editing schema.prisma (migrate + generate)
pnpm --filter api prisma:studio        # browse the database
pnpm --filter api test:e2e             # needs the database running
pnpm --filter api user:create --role PHYSIO --email x@example.com --name "Nombre"   # create a panel account (prints a password)
```

Mobile app (run inside `apps/mobile`; Flutter SDK in `C:\Users\joaqu\develop\flutter`, stable channel):

```bash
flutter emulators --launch Medium_Tablet   # start the tablet emulator (or Android Studio → Device Manager)
flutter run                                # build + run on the running device (r = hot reload, R = restart)
flutter analyze | flutter test             # lint/type-check, tests
flutter pub add <package>                  # add a dependency
```

Before finishing a task, run `pnpm build` and `pnpm lint` (and `flutter analyze` + `flutter test` if you touched `apps/mobile`).

## Mobile app

- **App ID (temporary):** Android `applicationId` `com.joaquinsalas.respira_app`, iOS bundle ID
  `com.joaquinsalas.respiraApp` (iOS doesn't allow `_`). Created with `--org com.joaquinsalas` while it's unclear
  who will publish the app. **Decide the final ID before the first store release**: after publishing it can never
  change (a new ID is a new app). Change it in `android/app/build.gradle.kts` (`namespace`, `applicationId`, plus
  the Kotlin package folder under `android/app/src/main/kotlin/`) and `ios/Runner.xcodeproj/project.pbxproj`
  (`PRODUCT_BUNDLE_IDENTIFIER`).
- Dart package name `respira_app` (imports: `package:respira_app/...`). Platforms: Android and iOS only.
  iOS builds need a Mac with Xcode; on Windows, develop and test on Android. App name shown to patients: "Respira"
  (placeholder; also `PATIENT_APP_NAME` in the web's `devices.labels.ts`).
- Structure: `lib/core/` (config, `api_client.dart`, `token_storage.dart`, `theme.dart`, `screen_layout.dart`) and
  `lib/features/<feature>/` mirroring the API (`pairing/`, `today/`, `workout/`). Inside a feature, three kinds of
  files with dependencies going one way only: **screens/widgets** → **logic** (plain Dart, no Flutter or HTTP, unit
  tested: `todays_routine.dart`, `workout_steps.dart`) → **data** (models with `fromJson` + `*_api.dart` calls via
  `ApiClient`). Large text and buttons come from `appTheme`; screens use `ScreenLayout` (title, scrolling content,
  buttons **pinned at the bottom** so they're always visible). UI text in Spanish, `usted` form.
- Patient routes in the API live under `/me/...` with `@Roles(PATIENT)` and take the patient from the session token,
  never from the URL. `GET /me/program` returns `{ program: null | {...} }` with only the fields the app needs.
- Workout flow: `TodayScreen` (no program / rest day / "Empezar"; picks today's routine with the **phone's date**,
  reloads when the app returns to the foreground) → `WorkoutScreen`, **one screen** that walks a list of steps built
  from the routine (safety check → each set with its rest → effort 0–10 → breathlessness 0–10 → "¡Muy bien!"), so
  the back button asks "¿Quiere dejar el entreno?" instead of jumping between steps. The check-in questions are a
  constant in `check_in_questions.dart` for now (must become data). **Nothing is saved yet** and a risky check-in
  answer blocks training but doesn't alert the physio yet: both come with the workout log.
- API URL: `--dart-define=API_URL=...`; default `http://10.0.2.2:3000/api` = the API on this PC seen from the
  emulator. Plain http is allowed only in debug builds (`android/app/src/debug/AndroidManifest.xml`).
- Telemetry is off on the dev machine: Flutter and Dart (`--disable-analytics`), Android Studio/emulator
  (declined in the setup wizard, `~/.android/analytics.settings` → `hasOptedIn: false`), VS Code
  (`telemetry.telemetryLevel: off`). Google's new Android CLI (used behind the deprecated `sdkmanager`) has no
  persistent opt-out, only a per-command `--no-metrics`; its uploads are pointed at a dead address with the user
  env vars `ANDROID_CLI_ANALYTICS_URL` / `ANDROID_CLI_CRASH_URL` = `http://127.0.0.1:9/` (undocumented, read from
  its code). Install SDK packages from Android Studio's SDK Manager rather than `sdkmanager`.

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
- **Panel look (custom brand, not default shadcn):** colors, font (Figtree, self-hosted via fontsource, never
  Google Fonts CDN) and radius live as tokens in `src/index.css`; use token classes (`bg-primary`, `text-warning`…),
  not raw hex. Pages start with `PageHeader`; statuses use `StatusMarker` (small squares: `ok`/`off`/`action`).
  Tables are ruled with no card box, tabs are underlined, controls ≥40px tall (tablets). New shadcn components must
  be restyled to match. Reference mockup: board "D · Combinada" in https://claude.ai/artifact/D36VSGeBgAkNPpzrJAQD1u.
- **Conventional Commits** with scopes: `feat(api): ...`, `fix(web): ...`, `chore: ...`. Commit only when asked.

## Authentication

- Our own code in `apps/api/src/auth/` (no auth library). Opaque random session tokens; the DB stores only
  their SHA-256 hash (`Session` table). Passwords are hashed with argon2 (`@node-rs/argon2`).
- Web panel: token in an `httpOnly`, `Secure`, `SameSite=Strict` cookie named `session` (72 h). Patient app
  (later): `Authorization: Bearer <token>`. `AuthGuard` accepts both.
- **Every route requires login by default** (global `AuthGuard`). Use `@Public()` to open one, `@Roles(...)`
  to restrict by role, and `@CurrentUser()` to get `{ userId, role, physiotherapistId, patientId }`.
- No public sign-up: panel accounts are created with `user:create`. Patients pair a device with a QR code.
- Web: `RequireAuth` guards pages; any 401 sets the current user to `null` and redirects to `/login`.
- **Patient pairing (printed connection sheet).** The physio prints a "hoja de conexión" from the patient record
  (`POST /patients/:id/pairing-code`, `devices/` module); it goes in the equipment bag the patient takes home. No
  name or personal data on the sheet. It has a QR (`respira://pair?code=K7QM4XPT9W`) and the same code to type
  (`K7QM4-XPT9W`). Code rules (`auth/pairing-code.ts`, mirrored in the app's `pairing_code.dart`): 10 characters
  without lookalikes (0/O, 1/I/L), valid **30 days**, **single use**, only its SHA-256 hash stored on
  `User.pairingCodeHash`; a new sheet replaces the previous code; discharge cancels it. The code is only returned once,
  so the panel shows it in a preview dialog with "Imprimir hoja de conexión" (print CSS prints only `.print-only`).
- The app redeems it with `POST /auth/pair` (`@Public`, 5 attempts/min per IP, same error for every bad code) and gets
  a `DEVICE` session: expires after **90 days without use** (each use pushes it forward). **One device per patient**:
  pairing revokes the previous device. The physio sees the device (`GET /patients/:id/device`) and can disconnect it
  (`DELETE`). When the app gets a 401 it deletes its token and goes back to the welcome screen.
- No fingerprint/face unlock in the app for now (decided; may come later).

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
- **`prisma migrate dev` refuses to run in a non-interactive shell** (e.g. an agent's) when it wants to show a
  warning. Generate the SQL with `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script`
  into a new `prisma/migrations/<timestamp>_<name>/migration.sql`, then `prisma migrate deploy` + `prisma generate`.
- **Migrations run in folder-name order.** A hand-named folder must sort *after* every existing one, or a fresh
  database (new server, CI) applies it too early. Check with `ls prisma/migrations` before naming one, and
  verify from scratch by running `prisma migrate deploy` against a throwaway database.
- **`flutter emulators --launch` can fail silently** (no emulator process, no error). If no device shows up in
  `flutter devices`, start it from Android Studio's Device Manager or run
  `%LOCALAPPDATA%\Android\Sdk\emulator\emulator.exe -avd Medium_Tablet` to see its log. The first boot logs
  "hanging thread" / crash-report warnings but finishes booting; wait for it.
- **The Android build needs the exact NDK Flutter asks for** (`flutter.ndkVersion`, currently `28.2.13676358`).
  Gradle's auto-install fails ("Package ndk not found") because `sdkmanager` now delegates to the new Android CLI.
  Install it from Android Studio → SDK Manager → SDK Tools → Show Package Details → NDK (Side by side).
  The first `flutter run` takes several minutes (Gradle downloads); later runs are fast.
- **The first build after adding a native plugin can take ~15 min** with no output (Gradle installs SDK platforms and
  CMake 3.22.1 for `flutter_zxing`'s C++, then compiles it). It isn't stuck; later builds take ~30 s.
- **`flutter_zxing` 3.1.0 draws its scan box relative to the screen's corner**, not its own. Keep `ReaderWidget`
  wrapped in a `RepaintBoundary` (see `scan_screen.dart`) or the box appears shifted.
- **The scanner reads the same QR many times per second.** `scan_screen.dart` never resends a code the API refused
  and waits 60 s after a 429; without that the app hits (and keeps itself inside) the pairing rate limit.
- **Testing QR scanning on the emulator:** the tablet AVD's back camera is a virtual 3D room. Start it with
  `emulator -avd Medium_Tablet -virtualscene-poster wall=<qr.png>`, or swap the image live with
  `adb emu virtualscene-image wall <file>`, then walk the camera there with
  `adb emu automation play <sdk>\emulator\resources\macros\Walk_to_image_room`. Put the QR small in a white image
  (~30 % wide), otherwise it's too close to read.
- e2e tests that call `POST /auth/pair` more than 5 times override `ThrottlerGuard` (see `devices.e2e-spec.ts`).
- **Testing on a real phone (USB):** enable USB debugging, then `adb reverse tcp:3000 tcp:3000` (again after
  replugging) and `flutter run -d <serial> --dart-define=API_URL=http://localhost:3000/api`. `adb -s` needs the
  serial from `adb devices` (e.g. `00277361P000310`), not the model name Flutter shows (`A069`).
- **adb from Git Bash rewrites device paths** (`/sdcard/...` → `C:/Program Files/Git/sdcard/...`). Prefix with
  `MSYS_NO_PATHCONV=1` or use PowerShell.

## Current status

- Done: monorepo, PostgreSQL + Prisma, exercises CRUD API + panel pages (list → `/exercises/:id` detail with
  "Editar" switching to the shared `ExerciseForm`, "Eliminar" refused with 409 if used; `/exercises/new` full page
  that opens the new exercise), models for physios/patients/programs,
  physio authentication (login/logout, protected API and panel), patients API + panel (list, create, record,
  edit, discharge/reactivate). Physios see only their own patients (others → 404); ADMIN sees and edits all.
  Patients are never deleted (clinical records must be kept): they are discharged (`dischargedAt`).
  In the UI this is **"Finalizar seguimiento"**, never "dar de alta" ("alta" also means signing up in Spanish).
- "Nuevo paciente" is a 3-step wizard (`PatientWizard.tsx`): `/patients/new` (personal + clinical data; saving
  creates the patient) → `/patients/:id/setup?step=program` (optional, `ProgramForm` on the page) →
  `?step=app` (optional; the pairing code is created only when the physio clicks "Preparar hoja de conexión").
  `PatientForm` and `ProgramForm` are shared with the record's edit dialogs. Mockup: board in
  https://claude.ai/artifact/W2xV1LkRNxDLsSLyymtkDL.
- Patient programs: `Program` (the treatment) → 1–2 `Routine`s (a fixed session repeated on its `daysOfWeek`;
  a day belongs to at most one routine, other days are rest) → `RoutineExercise` (sets, reps **or** durationSec,
  rest, `targetEffortPct` = target perceived effort 0–100 in steps of 10, i.e. 50 % ↔ 5/10). Physios said
  routines are therapeutic, very similar, and progress mainly by effort %, reps or days per week.
  One ACTIVE program per patient (assigning a new one ends the previous); ENDED programs are read-only
  history; no DELETE. `PUT /programs/:id` sends the whole program and updates routines and lines **by id**
  (not delete + recreate) so future workout logs can reference them. Programs reuse
  `PatientsService.visibleTo()` for access rules. UI: builder with one tab per routine in the patient record.
- Routine templates: `RoutineTemplate` → `RoutineTemplateExercise` (same prescription fields), a library shared by
  all physios (anyone creates/edits/deletes; not clinical records). No days: chosen per patient. "Cargar
  plantilla" in the program builder **copies** the lines into a routine and sets `Routine.templateId`
  (SetNull when the template is deleted). Exercise-line rules shared in `programs/routine-exercises.ts` (API)
  and `programs/exercise-line.schema.ts` + `ExerciseLineFields` (web). "Plantillas" page in the panel.
- Patient device pairing (see Authentication): API (`devices/` module + `POST /auth/pair`), panel ("App del paciente"
  section in the patient record, sheet preview + print, disconnect) and app (welcome → scan or type the code →
  "¡Listo!"). Tested end to end on the emulator and on a real phone (Nothing Phone 4a).
- Patient app skeleton: `GET /me/program` + home with its 3 states + the whole workout flow (see Mobile app).
  Tested on a real phone. Videos are a placeholder (`Exercise.videoUrl` exists, no storage or player yet).
- Not done: "Guardar como plantilla" from a patient's routine, workout logging (results, "no he podido" reasons,
  effort, safety alerts to the physio, "ya ha entrenado hoy", streaks), check-in questions as data, exercise videos,
  offline sessions, access log, deployment, testing the scanner on a low-end phone.
