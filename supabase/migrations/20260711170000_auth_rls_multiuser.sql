-- Multiuser Auth + RLS migration.
-- Additive only: no data is dropped or truncated.
--
-- Manual step before running:
-- Replace 00000000-0000-0000-0000-000000000000 with David's auth.users.id.
-- This assigns the existing single-user data to that Supabase Auth user.

do $$
declare
  david_user_id uuid := '00000000-0000-0000-0000-000000000000';
begin
  if david_user_id = '00000000-0000-0000-0000-000000000000' then
    raise exception 'Replace david_user_id with David auth.users.id before running this migration.';
  end if;

  if not exists (select 1 from auth.users where id = david_user_id) then
    raise exception 'David auth user % does not exist in auth.users.', david_user_id;
  end if;

  update public.exercises
     set user_id = david_user_id
   where user_id is null or user_id <> david_user_id;

  update public.workout_routines
     set user_id = david_user_id
   where user_id is null or user_id <> david_user_id;

  update public.workout_sessions
     set user_id = david_user_id
   where user_id is null or user_id <> david_user_id;

  update public.user_training_state
     set user_id = david_user_id
   where user_id is null or user_id <> david_user_id;
end $$;

alter table public.profiles
  add column if not exists id uuid,
  add column if not exists email text,
  add column if not exists role text not null default 'user',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.exercises
  add column if not exists user_id uuid;

alter table public.workout_routines
  add column if not exists user_id uuid;

alter table public.workout_sessions
  add column if not exists user_id uuid;

alter table public.user_training_state
  add column if not exists user_id uuid;

create unique index if not exists profiles_id_unique on public.profiles (id);
create unique index if not exists user_training_state_user_id_unique on public.user_training_state (user_id);
create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists workout_days_routine_id_idx on public.workout_days (routine_id);
create index if not exists exercises_in_day_day_id_idx on public.exercises_in_day (day_id);
create index if not exists workout_sessions_day_id_idx on public.workout_sessions (day_id);
create index if not exists exercise_logs_session_id_idx on public.exercise_logs (session_id);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, created_at, updated_at)
  values (new.id, new.email, 'user', now(), now())
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();

  insert into public.user_training_state (user_id, active_routine_id, next_day_index)
  values (new.id, null, 0)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
      from pg_trigger
     where tgname = 'on_auth_user_created_profile'
  ) then
    create trigger on_auth_user_created_profile
      after insert on auth.users
      for each row execute function public.handle_new_user_profile();
  end if;
end $$;

alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_routines enable row level security;
alter table public.workout_days enable row level security;
alter table public.exercises_in_day enable row level security;
alter table public.user_training_state enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.exercise_logs enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_select_own') then
    create policy profiles_select_own on public.profiles for select using (id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_insert_own') then
    create policy profiles_insert_own on public.profiles for insert with check (id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_update_own') then
    create policy profiles_update_own on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_delete_none') then
    create policy profiles_delete_none on public.profiles for delete using (false);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'exercises' and policyname = 'exercises_select_own') then
    create policy exercises_select_own on public.exercises for select using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'exercises' and policyname = 'exercises_insert_own') then
    create policy exercises_insert_own on public.exercises for insert with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'exercises' and policyname = 'exercises_update_own') then
    create policy exercises_update_own on public.exercises for update using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'exercises' and policyname = 'exercises_delete_own') then
    create policy exercises_delete_own on public.exercises for delete using (user_id = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'workout_routines' and policyname = 'routines_select_own') then
    create policy routines_select_own on public.workout_routines for select using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'workout_routines' and policyname = 'routines_insert_own') then
    create policy routines_insert_own on public.workout_routines for insert with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'workout_routines' and policyname = 'routines_update_own') then
    create policy routines_update_own on public.workout_routines for update using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'workout_routines' and policyname = 'routines_delete_own') then
    create policy routines_delete_own on public.workout_routines for delete using (user_id = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_training_state' and policyname = 'training_state_all_own') then
    create policy training_state_all_own on public.user_training_state for all using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'workout_sessions' and policyname = 'sessions_all_own') then
    create policy sessions_all_own on public.workout_sessions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'workout_days' and policyname = 'days_select_own') then
    create policy days_select_own on public.workout_days for select using (
      exists (
        select 1 from public.workout_routines r
        where r.id = workout_days.routine_id and r.user_id = auth.uid()
      )
    );
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'workout_days' and policyname = 'days_insert_own') then
    create policy days_insert_own on public.workout_days for insert with check (
      exists (
        select 1 from public.workout_routines r
        where r.id = workout_days.routine_id and r.user_id = auth.uid()
      )
    );
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'workout_days' and policyname = 'days_update_own') then
    create policy days_update_own on public.workout_days for update using (
      exists (
        select 1 from public.workout_routines r
        where r.id = workout_days.routine_id and r.user_id = auth.uid()
      )
    ) with check (
      exists (
        select 1 from public.workout_routines r
        where r.id = workout_days.routine_id and r.user_id = auth.uid()
      )
    );
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'workout_days' and policyname = 'days_delete_own') then
    create policy days_delete_own on public.workout_days for delete using (
      exists (
        select 1 from public.workout_routines r
        where r.id = workout_days.routine_id and r.user_id = auth.uid()
      )
    );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'exercises_in_day' and policyname = 'planned_all_own') then
    create policy planned_all_own on public.exercises_in_day for all using (
      exists (
        select 1
          from public.workout_days d
          join public.workout_routines r on r.id = d.routine_id
         where d.id = exercises_in_day.day_id and r.user_id = auth.uid()
      )
    ) with check (
      exists (
        select 1
          from public.workout_days d
          join public.workout_routines r on r.id = d.routine_id
         where d.id = exercises_in_day.day_id and r.user_id = auth.uid()
      )
    );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'exercise_logs' and policyname = 'logs_all_own') then
    create policy logs_all_own on public.exercise_logs for all using (
      exists (
        select 1 from public.workout_sessions s
        where s.id = exercise_logs.session_id and s.user_id = auth.uid()
      )
    ) with check (
      exists (
        select 1 from public.workout_sessions s
        where s.id = exercise_logs.session_id and s.user_id = auth.uid()
      )
    );
  end if;
end $$;
