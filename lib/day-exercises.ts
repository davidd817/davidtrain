"use server";

import { createClient, getUserId } from "@/lib/supabase/server";
import type { PlannedExercise } from "@/lib/types";

type DayExercise = PlannedExercise;

async function assertDayOwner(dayId: string) {
  const supabase = await createClient();
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("workout_days")
    .select("id, workout_routines!inner(user_id)")
    .eq("id", dayId)
    .eq("workout_routines.user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Dia no encontrado.");
  }
}

async function getExerciseInDayOwner(itemId: string) {
  const supabase = await createClient();
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("exercises_in_day")
    .select("*, workout_days!inner(workout_routines!inner(user_id))")
    .eq("id", itemId)
    .eq("workout_days.workout_routines.user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Ejercicio planificado no encontrado.");
  }

  return data as PlannedExercise;
}

export async function getExercisesByDay(dayId: string): Promise<DayExercise[]> {
  const supabase = await createClient();
  const userId = await getUserId();

  const { data, error } = await supabase
    .from("exercises_in_day")
    .select(
      `
      *,
      exercises (
        id,
        name,
        primary_muscle,
        secondary_muscle,
        notes,
        is_global
      ),
      workout_days!inner (
        workout_routines!inner (
          user_id
        )
      )
    `
    )
    .eq("day_id", dayId)
    .eq("workout_days.workout_routines.user_id", userId)
    .is("archived_at", null)
    .order("order_index", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DayExercise[];
}

export async function addExerciseToDay({
  dayId,
  exerciseId,
  sets,
  repsMin,
  repsMax,
  rir,
  restSeconds,
  notes,
  orderIndex,
}: {
  dayId: string;
  exerciseId: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  rir: number;
  restSeconds: number;
  notes?: string;
  orderIndex: number;
}) {
  const supabase = await createClient();
  const userId = await getUserId();
  await assertDayOwner(dayId);

  const { data: exercise, error: exerciseError } = await supabase
    .from("exercises")
    .select("id")
    .eq("id", exerciseId)
    .or(`is_global.eq.true,user_id.eq.${userId}`)
    .maybeSingle();

  if (exerciseError) {
    throw new Error(exerciseError.message);
  }

  if (!exercise) {
    throw new Error("Ejercicio no encontrado.");
  }

  const { data, error } = await supabase
    .from("exercises_in_day")
    .insert({
      day_id: dayId,
      exercise_id: exerciseId,
      sets,
      reps_min: repsMin,
      reps_max: repsMax,
      rir,
      rest_seconds: restSeconds,
      notes: notes || null,
      order_index: orderIndex,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as DayExercise;
}

export async function updateExerciseInDay({
  itemId,
  sets,
  repsMin,
  repsMax,
  rir,
  restSeconds,
  notes,
}: {
  itemId: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  rir: number;
  restSeconds: number;
  notes?: string;
}) {
  const supabase = await createClient();
  await getExerciseInDayOwner(itemId);

  const { data, error } = await supabase
    .from("exercises_in_day")
    .update({
      sets,
      reps_min: repsMin,
      reps_max: repsMax,
      rir,
      rest_seconds: restSeconds,
      notes: notes || null,
    })
    .eq("id", itemId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as DayExercise;
}

export async function archiveExerciseInDay(itemId: string) {
  const supabase = await createClient();
  await getExerciseInDayOwner(itemId);

  const { error } = await supabase
    .from("exercises_in_day")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", itemId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function duplicateExerciseInDay(itemId: string) {
  const supabase = await createClient();
  const item = await getExerciseInDayOwner(itemId);
  const siblings = await getExercisesByDay(item.day_id);

  const { data, error } = await supabase
    .from("exercises_in_day")
    .insert({
      day_id: item.day_id,
      exercise_id: item.exercise_id,
      sets: item.sets,
      reps_min: item.reps_min,
      reps_max: item.reps_max,
      rir: item.rir,
      rest_seconds: item.rest_seconds,
      notes: item.notes,
      order_index: siblings.length,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as DayExercise;
}

export async function moveExerciseInDay({
  dayId,
  itemId,
  direction,
}: {
  dayId: string;
  itemId: string;
  direction: "up" | "down";
}) {
  const supabase = await createClient();
  const items = await getExercisesByDay(dayId);
  const index = items.findIndex((item) => item.id === itemId);

  if (index === -1) {
    throw new Error("Ejercicio no encontrado.");
  }

  const targetIndex = direction === "up" ? index - 1 : index + 1;

  if (targetIndex < 0 || targetIndex >= items.length) {
    return;
  }

  const current = items[index];
  const target = items[targetIndex];

  const [{ error: currentError }, { error: targetError }] = await Promise.all([
    supabase
      .from("exercises_in_day")
      .update({ order_index: target.order_index })
      .eq("id", current.id),
    supabase
      .from("exercises_in_day")
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
