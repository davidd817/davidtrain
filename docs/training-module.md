# Training Module Notes

## Current Auth Model

The app still uses `DEV_USER_ID` as a temporary personal-user bridge. Code now filters owned records where the current schema makes that possible, but this is not a replacement for Supabase Auth and strict RLS.

## Pending Manual SQL

Run `supabase/migrations/20260711143000_training_module_completion.sql` in Supabase before using archive, duration, and idempotent completion features in production data.

## RLS Future Step

Once Supabase Auth is wired, enable RLS on:

- `profiles`
- `exercises`
- `workout_routines`
- `workout_days`
- `exercises_in_day`
- `user_training_state`
- `workout_sessions`
- `exercise_logs`

Tables with `user_id` should use `auth.uid() = user_id`. Child tables should use policies that check ownership through their parent routine, day, or session.
