# Deployment

## Environment Variables

Set these in Vercel Project Settings:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SITE_URL`

Use the production URL for `NEXT_PUBLIC_SITE_URL`, for example `https://your-app.vercel.app`.

Do not add service role keys to Vercel or the frontend.

## Supabase Auth URLs

In Supabase Auth settings:

- Site URL: `https://your-app.vercel.app`
- Redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `https://your-app.vercel.app/auth/callback`
  - `https://your-custom-domain.com/auth/callback` if you use a custom domain

## SQL Migrations

Run these in order in the Supabase SQL editor:

1. `supabase/migrations/20260711143000_training_module_completion.sql`
2. `supabase/migrations/20260711170000_auth_rls_multiuser.sql`

Before running the second file, replace the placeholder UUID with David's `auth.users.id`.

## Vercel

1. Connect the GitHub repository to Vercel.
2. Select this Next.js project.
3. Add the environment variables above.
4. Deploy.
5. Confirm the build command is `npm run build`.

## Smoke Test

1. Open `/register` and create a new account.
2. Confirm email if your Supabase project requires it.
3. Login and confirm `/dashboard` loads with empty states.
4. Create a routine, day, exercise, session, and log one set.
5. Logout.
6. Login as a second user and confirm no data from the first user is visible.
