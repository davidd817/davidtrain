-- Training module completion.
-- Additive migration only. No tables or data are dropped.

alter table public.exercises
  add column if not exists archived_at timestamptz;

alter table public.workout_routines
  add column if not exists archived_at timestamptz;

alter table public.workout_days
  add column if not exists archived_at timestamptz;

alter table public.exercises_in_day
  add column if not exists archived_at timestamptz;

alter table public.workout_sessions
  add column if not exists duration_seconds integer,
  add column if not exists completed_day_advanced_at timestamptz,
  add column if not exists notes text;

create unique index if not exists exercise_logs_unique_session_exercise_set
  on public.exercise_logs (session_id, exercise_id, set_number);

create index if not exists exercises_user_archived_idx
  on public.exercises (user_id, archived_at);

create index if not exists workout_routines_user_archived_idx
  on public.workout_routines (user_id, archived_at);

create index if not exists workout_sessions_user_completed_idx
  on public.workout_sessions (user_id, completed_at);

create index if not exists exercise_logs_exercise_session_idx
  on public.exercise_logs (exercise_id, session_id);

-- RLS hardening is implemented in the follow-up auth migration.
