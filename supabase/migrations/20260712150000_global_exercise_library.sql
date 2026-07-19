-- Global exercise library + per-user favorites.
-- Additive only: no tables or data are dropped or truncated.
--
-- Manual step before running:
-- Replace 00000000-0000-0000-0000-000000000000 with David's auth.users.id.
-- Existing David-owned exercises are marked as global without changing their IDs,
-- preserving exercises_in_day, exercise_logs, history and progress relations.

alter table public.exercises
  add column if not exists is_global boolean not null default false,
  add column if not exists source_exercise_id uuid null references public.exercises(id),
  add column if not exists archived_at timestamptz null;

create index if not exists exercises_global_archived_idx
  on public.exercises (is_global, archived_at);

create index if not exists exercises_user_global_archived_idx
  on public.exercises (user_id, is_global, archived_at);

create index if not exists exercises_source_exercise_id_idx
  on public.exercises (source_exercise_id);

create table if not exists public.user_exercise_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, exercise_id)
);

create index if not exists user_exercise_favorites_exercise_id_idx
  on public.user_exercise_favorites (exercise_id);

alter table public.exercises enable row level security;
alter table public.user_exercise_favorites enable row level security;

do $$
declare
  david_user_id uuid := '4c132550-3afb-4323-9d59-dd6f4ae936ac';
begin
  if david_user_id = '00000000-0000-0000-0000-000000000000' then
    raise exception 'Replace david_user_id with David auth.users.id before running this migration.';
  end if;

  if not exists (select 1 from auth.users where id = david_user_id) then
    raise exception 'David auth user % does not exist in auth.users.', david_user_id;
  end if;

  update public.exercises
     set is_global = true,
         source_exercise_id = null
   where user_id = david_user_id;

  insert into public.user_exercise_favorites (user_id, exercise_id)
  select david_user_id, id
    from public.exercises
   where user_id = david_user_id
     and is_favorite is true
  on conflict (user_id, exercise_id) do nothing;
end $$;

do $$
begin
  if exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'exercises' and policyname = 'exercises_select_own'
  ) then
    alter policy exercises_select_own on public.exercises
      to authenticated
      using (is_global = true or user_id = auth.uid());
  else
    create policy exercises_select_own on public.exercises
      for select to authenticated
      using (is_global = true or user_id = auth.uid());
  end if;

  if exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'exercises' and policyname = 'exercises_insert_own'
  ) then
    alter policy exercises_insert_own on public.exercises
      to authenticated
      with check (user_id = auth.uid() and is_global = false);
  else
    create policy exercises_insert_own on public.exercises
      for insert to authenticated
      with check (user_id = auth.uid() and is_global = false);
  end if;

  if exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'exercises' and policyname = 'exercises_update_own'
  ) then
    alter policy exercises_update_own on public.exercises
      to authenticated
      using (user_id = auth.uid() and is_global = false)
      with check (user_id = auth.uid() and is_global = false);
  else
    create policy exercises_update_own on public.exercises
      for update to authenticated
      using (user_id = auth.uid() and is_global = false)
      with check (user_id = auth.uid() and is_global = false);
  end if;

  if exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'exercises' and policyname = 'exercises_delete_own'
  ) then
    alter policy exercises_delete_own on public.exercises
      to authenticated
      using (user_id = auth.uid() and is_global = false);
  else
    create policy exercises_delete_own on public.exercises
      for delete to authenticated
      using (user_id = auth.uid() and is_global = false);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'user_exercise_favorites' and policyname = 'favorites_select_own'
  ) then
    create policy favorites_select_own on public.user_exercise_favorites
      for select to authenticated
      using (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'user_exercise_favorites' and policyname = 'favorites_insert_own'
  ) then
    create policy favorites_insert_own on public.user_exercise_favorites
      for insert to authenticated
      with check (
        user_id = auth.uid()
        and exists (
          select 1
            from public.exercises e
           where e.id = exercise_id
             and (e.is_global = true or e.user_id = auth.uid())
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'user_exercise_favorites' and policyname = 'favorites_delete_own'
  ) then
    create policy favorites_delete_own on public.user_exercise_favorites
      for delete to authenticated
      using (user_id = auth.uid());
  end if;
end $$;


-- Tighten child-table writes so a user cannot attach another user's private
-- exercise by guessing its UUID. Reads remain anchored to owned days/sessions.
do $$
begin
  if exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'exercises_in_day' and policyname = 'planned_all_own'
  ) then
    alter policy planned_all_own on public.exercises_in_day
      to authenticated
      using (
        exists (
          select 1
            from public.workout_days d
            join public.workout_routines r on r.id = d.routine_id
           where d.id = day_id
             and r.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1
            from public.workout_days d
            join public.workout_routines r on r.id = d.routine_id
           where d.id = day_id
             and r.user_id = auth.uid()
        )
        and exists (
          select 1
            from public.exercises e
           where e.id = exercise_id
             and (e.is_global = true or e.user_id = auth.uid())
        )
      );
  else
    create policy planned_all_own on public.exercises_in_day
      for all to authenticated
      using (
        exists (
          select 1
            from public.workout_days d
            join public.workout_routines r on r.id = d.routine_id
           where d.id = day_id
             and r.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1
            from public.workout_days d
            join public.workout_routines r on r.id = d.routine_id
           where d.id = day_id
             and r.user_id = auth.uid()
        )
        and exists (
          select 1
            from public.exercises e
           where e.id = exercise_id
             and (e.is_global = true or e.user_id = auth.uid())
        )
      );
  end if;

  if exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'exercise_logs' and policyname = 'logs_all_own'
  ) then
    alter policy logs_all_own on public.exercise_logs
      to authenticated
      using (
        exists (
          select 1
            from public.workout_sessions s
           where s.id = session_id
             and s.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1
            from public.workout_sessions s
           where s.id = session_id
             and s.user_id = auth.uid()
        )
        and exists (
          select 1
            from public.exercises e
           where e.id = exercise_id
             and (e.is_global = true or e.user_id = auth.uid())
        )
      );
  else
    create policy logs_all_own on public.exercise_logs
      for all to authenticated
      using (
        exists (
          select 1
            from public.workout_sessions s
           where s.id = session_id
             and s.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1
            from public.workout_sessions s
           where s.id = session_id
             and s.user_id = auth.uid()
        )
        and exists (
          select 1
            from public.exercises e
           where e.id = exercise_id
             and (e.is_global = true or e.user_id = auth.uid())
        )
      );
  end if;
end $$;
