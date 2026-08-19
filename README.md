# DavidTrain

DavidTrain is a personal web application for planning and tracking training. The repository focuses on the training module: exercise library, workout routines, sessions, history and progress metrics.

## Current status

The main workflow is implemented and uses Supabase Auth with cookie-based sessions. The application supports:

- creating, editing, archiving, duplicating and reordering routines and workout days;
- creating and managing personal exercises and browsing a global exercise library;
- adding planned exercises with sets, repetition ranges, RIR, rest periods and notes;
- activating a routine, progressing through its workout days and skipping a day;
- starting, continuing, cancelling and completing workout sessions;
- recording weight, repetitions and RIR for each set;
- showing previous performance for the same exercise and workout day during a session;
- reviewing training history, volume, frequency, best loads and estimated 1RM;
- attaching and validating YouTube technique links.

The nutrition route currently exists only as a placeholder screen and is outside the scope of this project.

## Stack and architecture

- Next.js 16 with App Router and TypeScript.
- React 19, Tailwind CSS 4 and lightweight UI components.
- Supabase Auth, Supabase SSR and PostgreSQL.
- Development with Webpack, using `next dev --webpack`.

Server-rendered pages live in `app/`. Interactive components are located in `components/`. Server Actions and domain queries live in `lib/`, with Supabase clients under `lib/supabase/`. Versioned SQL migrations are stored in `supabase/migrations/`, while manual utilities are located in `scripts/`.

The typical application flow is:

1. a page under `app/` retrieves data through functions in `lib/`;
2. mutations are executed through Server Actions;
3. client components update the interface and refresh server data;
4. Supabase Auth identifies the user and RLS policies restrict access to that user's data.


## Requirements

- Node.js 22 LTS or later, including support for the native test baseline;
- npm;
- a Supabase project configured with the migrations included in this repository..

## Local installation

```bash
git clone https://github.com/davidd817/davidtrain.git
cd davidtrain
copy .env.example .env.local
npm ci
```

Fill `.env.local` with the values from your own Supabase project. Do not commit this file to the repository.

## Environment variables

The environment variables supported by the application and documented in `.env.example` are:

- `NEXT_PUBLIC_SUPABASE_URL`: public URL of the Supabase project.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: publishable/anonymous project key.
- `NEXT_PUBLIC_SITE_URL`: application origin used for Auth links.
- `IMPORT_USER_ID`: optional; only used by the manual exercise import script.

A `service_role` key is not required and should not be configured to run the application.

## Development and commands

```bash
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

The development server is available at `http://localhost:3000`. `npm test` uses Node's built-in test runner to validate pure application logic without adding testing dependencies.

## Supabase and migrations

The main model uses `profiles`, `exercises`, `workout_routines`, `workout_days`, `exercises_in_day`, `user_training_state`, `workout_sessions` and `exercise_logs`. Additional functionality uses `user_exercise_favorites` and `workout_day_skips`.

Migrations are applied manually in Supabase in chronological order and are not executed by the application or CI. Before applying them to an existing project, review their RLS policies, functions and data changes. See [docs/deployment.md](docs/deployment.md) y [docs/known-risks.md](docs/known-risks.md).

## Deployment

The project is compatible with a standard Next.js deployment, including Vercel.
This repository does not contain a dedicated deployment workflow. If Vercel is connected to the repository, preview and production deployments depend on the external Vercel project configuration.
Configure the required environment variables in the deployment provider, use `npm run build` cas the build command and add the corresponding callback URLs in Supabase. Deployment instructions are documented in [docs/deployment.md](docs/deployment.md).

## Security and limitations

- Supabase keys exposed to the browser must be publishable keys only.
- Authorization relies on Supabase Auth and Row Level Security; the Auth/RLS migrations must be applied and reviewed before multi-user use.
- The exercise importer is a manual administrative utility that writes to Supabase and should not be used as a normal onboarding mechanism.
- CI does not run end-to-end tests against Supabase, Vercel or a real authentication environment.
- A reachable Supabase project is required to test complete application flows.

## Contributing and development workflow

Read [AGENTS.md](AGENTS.md) before modifying the repository and [CONTRIBUTING.md](CONTRIBUTING.md) for the expected development workflow.
Keep changes small, avoid editing existing migrations without an explicit reason, and run lint, typecheck, tests and build before requesting review.
