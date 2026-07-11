import { supabase } from "@/lib/supabase";
import { DEV_USER_ID } from "@/lib/config";
import type { PlannedExercise, WorkoutDay } from "@/lib/types";

export async function getDaysByRoutine(routineId: string): Promise<WorkoutDay[]> {
  const { data, error } = await supabase
    .from("workout_days")
    .select("*, workout_routines!inner(user_id)")
    .eq("routine_id", routineId)
    .eq("workout_routines.user_id", DEV_USER_ID)
    .is("archived_at", null)
    .order("order_index", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as WorkoutDay[];
}

export async function getWorkoutDayById(dayId: string): Promise<WorkoutDay | null> {
  const { data, error } = await supabase
    .from("workout_days")
    .select("*, workout_routines!inner(user_id)")
    .eq("id", dayId)
    .eq("workout_routines.user_id", DEV_USER_ID)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as WorkoutDay | null;
}

export async function createWorkoutDay({
  routineId,
  name,
  orderIndex,
}: {
  routineId: string;
  name: string;
  orderIndex: number;
}) {
  const { data, error } = await supabase
    .from("workout_days")
    .insert({
      routine_id: routineId,
      name,
      order_index: orderIndex,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as WorkoutDay;
}

export async function updateWorkoutDay({
  dayId,
  name,
}: {
  dayId: string;
  name: string;
}) {
  const day = await getWorkoutDayById(dayId);

  if (!day) {
    throw new Error("Dia no encontrado.");
  }

  const { data, error } = await supabase
    .from("workout_days")
    .update({ name })
    .eq("id", dayId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as WorkoutDay;
}

export async function archiveWorkoutDay(dayId: string) {
  const day = await getWorkoutDayById(dayId);

  if (!day) {
    throw new Error("Dia no encontrado.");
  }

  const { error } = await supabase
    .from("workout_days")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", dayId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function duplicateWorkoutDay(dayId: string) {
  const day = await getWorkoutDayById(dayId);

  if (!day) {
    throw new Error("Dia no encontrado.");
  }

  const days = await getDaysByRoutine(day.routine_id);

  const { data: newDay, error: dayError } = await supabase
    .from("workout_days")
    .insert({
      routine_id: day.routine_id,
      name: `${day.name} copia`,
      order_index: days.length,
    })
    .select()
    .single();

  if (dayError) {
    throw new Error(dayError.message);
  }

  const { data: planned, error: plannedError } = await supabase
    .from("exercises_in_day")
    .select("*")
    .eq("day_id", dayId)
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
    const { error } = await supabase.from("exercises_in_day").insert(rows);

    if (error) {
      throw new Error(error.message);
    }
  }

  return newDay as WorkoutDay;
}

export async function moveWorkoutDay({
  routineId,
  dayId,
  direction,
}: {
  routineId: string;
  dayId: string;
  direction: "up" | "down";
}) {
  const days = await getDaysByRoutine(routineId);
  const index = days.findIndex((day) => day.id === dayId);

  if (index === -1) {
    throw new Error("Dia no encontrado.");
  }

  const targetIndex = direction === "up" ? index - 1 : index + 1;

  if (targetIndex < 0 || targetIndex >= days.length) {
    return;
  }

  const current = days[index];
  const target = days[targetIndex];

  const [{ error: currentError }, { error: targetError }] = await Promise.all([
    supabase
      .from("workout_days")
      .update({ order_index: target.order_index })
      .eq("id", current.id),
    supabase
      .from("workout_days")
      .update({ order_index: current.order_index })
      .eq("id", target.id),
  ]);

  if (currentError) {
    throw new Error(currentError.message);
  }

  if (targetError) {
    throw new Error(targetError.message);
  }
}
