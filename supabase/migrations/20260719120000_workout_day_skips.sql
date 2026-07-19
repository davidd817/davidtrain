-- Track intentionally skipped routine days.
-- Additive only: no data is dropped or truncated.

create table if not exists public.workout_day_skips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  routine_id uuid not null references public.workout_routines(id) on delete cascade,
  day_id uuid not null references public.workout_days(id) on delete cascade,
  skipped_at timestamptz not null default now(),
  reason text null
);

create index if not exists workout_day_skips_user_skipped_at_idx
  on public.workout_day_skips (user_id, skipped_at desc);

create index if not exists workout_day_skips_routine_day_idx
  on public.workout_day_skips (routine_id, day_id);

alter table public.workout_day_skips enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'workout_day_skips' and policyname = 'workout_day_skips_select_own'
  ) then
    create policy workout_day_skips_select_own on public.workout_day_skips
      for select to authenticated
      using (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'workout_day_skips' and policyname = 'workout_day_skips_insert_own'
  ) then
    create policy workout_day_skips_insert_own on public.workout_day_skips
      for insert to authenticated
      with check (
        user_id = auth.uid()
        and exists (
          select 1
            from public.workout_routines r
           where r.id = routine_id
             and r.user_id = auth.uid()
        )
        and exists (
          select 1
            from public.workout_days d
            join public.workout_routines r on r.id = d.routine_id
           where d.id = day_id
             and d.routine_id = routine_id
             and r.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'workout_day_skips' and policyname = 'workout_day_skips_update_own'
  ) then
    create policy workout_day_skips_update_own on public.workout_day_skips
      for update to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'workout_day_skips' and policyname = 'workout_day_skips_delete_own'
  ) then
    create policy workout_day_skips_delete_own on public.workout_day_skips
      for delete to authenticated
      using (user_id = auth.uid());
  end if;
end $$;
