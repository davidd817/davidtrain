import { supabase } from "@/lib/supabase";
import { DEV_USER_ID } from "@/lib/config";
import type { PlannedExercise, Routine, WorkoutDay } from "@/lib/types";

export type RoutineWithStats = Routine & {
  day_count: number;
  exercise_count: number;
  is_active: boolean;
};

export async function getRoutines({
  includeArchived = false,
}: {
  includeArchived?: boolean;
} = {}): Promise<Routine[]> {
  let query = supabase
    .from("workout_routines")
    .select("*")
    .eq("user_id", DEV_USER_ID)
    .order("created_at", { ascending: false });

  if (!includeArchived) {
    query = query.is("archived_at", null);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Routine[];
}

export async function getRoutineById(routineId: string): Promise<Routine | null> {
  const { data, error } = await supabase
    .from("workout_routines")
    .select("*")
    .eq("id", routineId)
    .eq("user_id", DEV_USER_ID)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Routine | null;
}

export async function getRoutinesWithStats({
  activeRoutineId,
}: {
  activeRoutineId?: string | null;
} = {}): Promise<RoutineWithStats[]> {
  const routines = await getRoutines();

  if (routines.length === 0) {
    return [];
  }

  const routineIds = routines.map((routine) => routine.id);

  const { data: days, error: daysError } = await supabase
    .from("workout_days")
    .select("id,routine_id")
    .in("routine_id", routineIds)
    .is("archived_at", null);

  if (daysError) {
    throw new Error(daysError.message);
  }

  const dayIds = (days ?? []).map((day) => day.id);
  const { data: planned, error: plannedError } =
    dayIds.length > 0
      ? await supabase
          .from("exercises_in_day")
          .select("id,day_id")
          .in("day_id", dayIds)
          .is("archived_at", null)
      : { data: [], error: null };

  if (plannedError) {
    throw new Error(plannedError.message);
  }

  return routines.map((routine) => {
    const routineDays = (days ?? []).filter((day) => day.routine_id === routine.id);
    const dayIds = new Set(routineDays.map((day) => day.id));
    const exerciseCount = (planned ?? []).filter((item) => dayIds.has(item.day_id)).length;

    return {
      ...routine,
      day_count: routineDays.length,
      exercise_count: exerciseCount,
      is_active: activeRoutineId === routine.id,
    };
  });
}

export async function createRoutine(name: string, description?: string) {
  const { data, error } = await supabase
    .from("workout_routines")
    .insert({
      user_id: DEV_USER_ID,
      name,
      description: description || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Routine;
}

export async function updateRoutine({
  routineId,
  name,
  description,
}: {
  routineId: string;
  name: string;
  description?: string;
}) {
  const { data, error } = await supabase
    .from("workout_routines")
    .update({
      name,
      description: description || null,
    })
    .eq("id", routineId)
    .eq("user_id", DEV_USER_ID)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Routine;
}

export async function archiveRoutine(routineId: string) {
  const { error } = await supabase
    .from("workout_routines")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", routineId)
    .eq("user_id", DEV_USER_ID);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteRoutineIfSafe(routineId: string) {
  const { count, error: countError } = await supabase
    .from("workout_sessions")
    .select("id", { count: "exact", head: true })
    .eq("routine_id", routineId)
    .eq("user_id", DEV_USER_ID);

  if (countError) {
    throw new Error(countError.message);
  }

  if ((count ?? 0) > 0) {
    throw new Error("Esta rutina tiene sesiones en el historial. Archivala para conservar datos.");
  }

  const { error } = await supabase
    .from("workout_routines")
    .delete()
    .eq("id", routineId)
    .eq("user_id", DEV_USER_ID);

  if (error) {
    throw new Error(error.message);
  }
}

export async function duplicateRoutine(routineId: string) {
  const routine = await getRoutineById(routineId);

  if (!routine) {
    throw new Error("Rutina no encontrada.");
  }

  const { data: newRoutine, error: routineError } = await supabase
    .from("workout_routines")
    .insert({
      user_id: DEV_USER_ID,
      name: `${routine.name} copia`,
      description: routine.description,
    })
    .select()
    .single();

  if (routineError) {
    throw new Error(routineError.message);
  }

  const { data: sourceDays, error: daysError } = await supabase
    .from("workout_days")
    .select("*")
    .eq("routine_id", routineId)
    .is("archived_at", null)
    .order("order_index", { ascending: true });

  if (daysError) {
    throw new Error(daysError.message);
  }

  for (const sourceDay of (sourceDays ?? []) as WorkoutDay[]) {
    const { data: newDay, error: dayError } = await supabase
      .from("workout_days")
      .insert({
        routine_id: newRoutine.id,
        name: sourceDay.name,
        order_index: sourceDay.order_index,
      })
      .select()
      .single();

    if (dayError) {
      throw new Error(dayError.message);
    }

    const { data: planned, error: plannedError } = await supabase
      .from("exercises_in_day")
      .select("*")
      .eq("day_id", sourceDay.id)
      .is("archived_at", null)
      .order("order_index", { ascending: true });

    if (plannedError) {
      throw new Error(plannedError.message);
    }

    const rows = ((planned ?? []) as PlannedExercise[]).map((item) => ({
      day_id: newDay.id,
      exercise_id: item.exercise_id,
      sets: item.sets,
      reps_min: item.reps_min,
      reps_max: item.reps_max,
      rir: item.rir,
      rest_seconds: item.rest_seconds,
      notes: item.notes,
      order_index: item.order_index,
    }));

    if (rows.length > 0) {
      const { error: insertError } = await supabase.from("exercises_in_day").insert(rows);

      if (insertError) {
        throw new Error(insertError.message);
      }
    }
  }

  return newRoutine as Routine;
}
