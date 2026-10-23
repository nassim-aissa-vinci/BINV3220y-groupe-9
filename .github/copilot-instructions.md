# Copilot instructions

## Project overview

Gesta is a student internship-management web app in an npm-workspaces monorepo. The root
scripts coordinate `backend/` (Express, TypeScript, SQLite via `better-sqlite3`) and
`frontend/` (React, TypeScript, Vite). Read `docs/architecture.md` for the layer map and
existing end-to-end feature examples, `backend/API.md` for API contracts, and
`docs/cdc_gesta_developpement.md` for business requirements and implementation scope.

The backend request flow is `main.ts` → `app.ts` → middleware → controllers → services →
repositories → SQLite. Controllers handle HTTP input and responses; services own business
rules and permissions; repositories contain SQL; mappers convert database rows and domain
objects to API DTOs. `createApp` wires these layers with injected database/config
dependencies, which lets tests exercise the complete API with an isolated in-memory
database.

The frontend follows the course's MVVM structure: pages compose reusable components and
hooks; hooks manage display/session state; services call `/api/...`; models and type guards
describe and validate API data. Vite proxies `/api` to the backend and removes that prefix.
`App.tsx` owns the single `useAuth` instance and passes session state to pages.

## Build, test, and lint

Use Node.js 22.14 or newer. Run commands from the repository root:

```sh
npm ci
npm run setup
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
npm run check
```

`npm run setup` creates `backend/.env` if needed and initializes the local SQLite database
with demo data. `npm run check` runs lint, typecheck, tests, and build.

Run one test file by passing its path to the workspace Vitest script:

```sh
npm run test -w backend -- tests/offers.test.ts
npm run test -w frontend -- tests/OffersPage.test.tsx
```

Run a single named test by adding Vitest's `-t` filter:

```sh
npm run test -w backend -- tests/offers.test.ts -t "refuse une requête sans session"
```

Backend tests use Vitest and Supertest with an in-memory SQLite database; frontend tests
use Vitest, jsdom, and Testing Library. Never point tests at the local development database.

## Repository-specific conventions

- Preserve the backend's dependency-injected layer boundaries: services do not receive
  Express `Request` or `Response` objects, and SQL stays in repositories.
- Validate HTTP query/body input in controllers using the existing hand-written type-guard
  approach. Report expected API failures with `HttpError`; the centralized error handler
  formats them as `{ "error": { "code", "message" } }`.
- Keep permission rules named and centralized in `backend/src/services/permissions.ts`.
  The authentication middleware reloads the account, roles, and companies from the
  database on each request; do not treat frontend state or token claims as authorization.
- Backend relative TypeScript imports include the `.ts` extension because the compiler
  rewrites them to `.js`. The API's `Authorization` header contains the token directly,
  without a `Bearer` prefix.
- Frontend API services check HTTP status and validate JSON with type guards from
  `frontend/src/utils/guards.ts` through `readJson`. Keep API calls in services and use
  the existing hooks to expose loading, error, and unauthorized-session state to pages.
- Add schema changes as a new ordered `backend/src/db/migrations/NNN_name.sql` migration;
  do not edit migrations that have already been applied. Database status codes are in
  English, with French labels presented by the frontend.
- The demo-login mode is for local development only and is rejected in production. Do not
  describe or extend it as real authentication.
