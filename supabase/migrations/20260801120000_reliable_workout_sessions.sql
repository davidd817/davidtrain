-- Reliable workout completion and cancellation.
-- Additive only: no data is dropped or truncated.

alter table public.workout_sessions
  add column if not exists status text not null default 'in_progress',
  add column if not exists cancelled_at timestamptz null,
  add column if not exists cancellation_reason text null,
  add column if not exists completed_day_index integer null,
  add column if not exists resulting_next_day_index integer null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'workout_sessions_status_check'
       and conrelid = 'public.workout_sessions'::regclass
  ) then
    alter table public.workout_sessions
      add constraint workout_sessions_status_check
      check (status in ('in_progress', 'completed', 'cancelled'));
  end if;
end $$;

update public.workout_sessions
   set status = case
     when cancelled_at is not null then 'cancelled'
     when completed_at is not null then 'completed'
     else 'in_progress'
   end
 where status is null
    or status not in ('in_progress', 'completed', 'cancelled')
    or (completed_at is not null and status <> 'completed')
    or (cancelled_at is not null and status <> 'cancelled');

create index if not exists workout_sessions_user_status_idx
  on public.workout_sessions (user_id, status);

create index if not exists workout_sessions_user_completed_status_idx
  on public.workout_sessions (user_id, completed_at desc)
  where status = 'completed' and completed_at is not null;

do $$
begin
  if not exists (
    select 1 from pg_indexes
     where schemaname = 'public'
       and indexname = 'workout_sessions_one_in_progress_per_user_idx'
  ) and not exists (
    select 1
      from public.workout_sessions
     where status = 'in_progress'
       and completed_at is null
       and cancelled_at is null
     group by user_id
    having count(*) > 1
  ) then
    create unique index workout_sessions_one_in_progress_per_user_idx
      on public.workout_sessions (user_id)
      where status = 'in_progress'
        and completed_at is null
        and cancelled_at is null;
  end if;
end $$;

create or replace function public.complete_workout_session_atomic(p_session_id uuid)
returns table (
  status text,
  session_id uuid,
  completed_at timestamptz,
  previous_day_index integer,
  next_day_index integer,
  next_day_name text
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_session public.workout_sessions%rowtype;
  v_state public.user_training_state%rowtype;
  v_completed_at timestamptz;
  v_previous_index integer;
  v_next_index integer;
  v_next_name text;
begin
  if v_user_id is null then
    raise exception 'Authentication required.';
  end if;

  select *
    into v_session
    from public.workout_sessions
   where id = p_session_id
     and user_id = v_user_id
   for update;

  if not found then
    raise exception 'Workout session not found.';
  end if;

  if v_session.cancelled_at is not null or v_session.status = 'cancelled' then
    status := 'cancelled';
    session_id := v_session.id;
    completed_at := v_session.completed_at;
    previous_day_index := v_session.completed_day_index;
    next_day_index := v_session.resulting_next_day_index;
    next_day_name := null;
    return next;
    return;
  end if;

  if v_session.completed_at is not null or v_session.status = 'completed' then
    if v_session.resulting_next_day_index is not null and v_session.routine_id is not null then
      select d.name
        into v_next_name
        from (
          select id, name, row_number() over (order by order_index asc, id asc)::integer - 1 as idx
            from public.workout_days
           where routine_id = v_session.routine_id
             and archived_at is null
        ) d
       where d.idx = v_session.resulting_next_day_index
       limit 1;
    end if;

    status := 'already_completed';
    session_id := v_session.id;
    completed_at := v_session.completed_at;
    previous_day_index := v_session.completed_day_index;
    next_day_index := v_session.resulting_next_day_index;
    next_day_name := v_next_name;
    return next;
    return;
  end if;

  select *
    into v_state
    from public.user_training_state
   where user_id = v_user_id
   for update;

  if not found then
    raise exception 'Training state not found.';
  end if;

  if v_state.active_routine_id is null
     or v_session.routine_id is null
     or v_state.active_routine_id <> v_session.routine_id then
    raise exception 'Session routine is not active.';
  end if;

  if v_session.day_id is null then
    raise exception 'Session day is missing.';
  end if;

  select d.idx
    into v_previous_index
    from (
      select id, row_number() over (order by order_index asc, id asc)::integer - 1 as idx
        from public.workout_days
       where routine_id = v_state.active_routine_id
         and archived_at is null
    ) d
   where d.id = v_session.day_id
   limit 1;

  if v_previous_index is null then
    raise exception 'Session day is not active in the current routine.';
  end if;

  select d.idx, d.name
    into v_next_index, v_next_name
    from (
      select id, name, row_number() over (order by order_index asc, id asc)::integer - 1 as idx
        from public.workout_days
       where routine_id = v_state.active_routine_id
         and archived_at is null
    ) d
   where d.idx > v_previous_index
   order by d.idx asc
   limit 1;

  if v_next_index is null then
    select d.idx, d.name
      into v_next_index, v_next_name
      from (
        select id, name, row_number() over (order by order_index asc, id asc)::integer - 1 as idx
          from public.workout_days
         where routine_id = v_state.active_routine_id
           and archived_at is null
      ) d
     order by d.idx asc
     limit 1;
  end if;

  if v_next_index is null then
    raise exception 'Routine has no active days.';
  end if;

  v_completed_at := now();

  update public.workout_sessions
     set completed_at = v_completed_at,
         duration_seconds = greatest(0, round(extract(epoch from (v_completed_at - started_at)))::integer),
         completed_day_advanced_at = v_completed_at,
         completed_day_index = v_previous_index,
         resulting_next_day_index = v_next_index,
         status = 'completed'
   where id = v_session.id
     and user_id = v_user_id;

  update public.user_training_state
     set next_day_index = v_next_index,
         updated_at = v_completed_at
   where user_id = v_user_id;

  status := 'completed';
  session_id := v_session.id;
  completed_at := v_completed_at;
  previous_day_index := v_previous_index;
  next_day_index := v_next_index;
  next_day_name := v_next_name;
  return next;
end;
$$;

create or replace function public.cancel_workout_session_atomic(
  p_session_id uuid,
  p_reason text default null
)
returns table (
  status text,
  session_id uuid,
  cancelled_at timestamptz
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_session public.workout_sessions%rowtype;
  v_cancelled_at timestamptz;
begin
  if v_user_id is null then
    raise exception 'Authentication required.';
  end if;

  select *
    into v_session
    from public.workout_sessions
   where id = p_session_id
     and user_id = v_user_id
   for update;

  if not found then
    raise exception 'Workout session not found.';
  end if;

  if v_session.completed_at is not null or v_session.status = 'completed' then
    status := 'completed';
    session_id := v_session.id;
    cancelled_at := v_session.cancelled_at;
    return next;
    return;
  end if;

  if v_session.cancelled_at is not null or v_session.status = 'cancelled' then
    status := 'already_cancelled';
    session_id := v_session.id;
    cancelled_at := v_session.cancelled_at;
    return next;
    return;
  end if;

  v_cancelled_at := now();

  update public.workout_sessions
     set status = 'cancelled',
         cancelled_at = v_cancelled_at,
         cancellation_reason = nullif(trim(p_reason), '')
   where id = v_session.id
     and user_id = v_user_id;

  status := 'cancelled';
  session_id := v_session.id;
  cancelled_at := v_cancelled_at;
  return next;
end;
$$;

revoke all on function public.complete_workout_session_atomic(uuid) from public;
revoke all on function public.complete_workout_session_atomic(uuid) from anon;
grant execute on function public.complete_workout_session_atomic(uuid) to authenticated;

revoke all on function public.cancel_workout_session_atomic(uuid, text) from public;
revoke all on function public.cancel_workout_session_atomic(uuid, text) from anon;
grant execute on function public.cancel_workout_session_atomic(uuid, text) to authenticated;
