# Training Module Notes

## Current Auth Model

The app uses Supabase Auth sessions via cookies. Application code should not use fixed user IDs.

## Pending Manual SQL

Run `supabase/migrations/20260711143000_training_module_completion.sql` and the auth/RLS migration in Supabase before using the multiuser production app.

## RLS

The multiuser migration enables RLS on:

- `profiles`
- `exercises`
- `workout_routines`
- `workout_days`
- `exercises_in_day`
- `user_training_state`
- `workout_sessions`
- `exercise_logs`

Tables with `user_id` use `auth.uid() = user_id`. Child tables use policies that check ownership through their parent routine, day, or session.

## Exercise Import Script

`scripts/import-exercises.js` is now a manual admin utility. It requires `IMPORT_USER_ID` and should not be used for regular multiuser onboarding. New users start with an empty personal library.
