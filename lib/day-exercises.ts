import { supabase } from "@/lib/supabase";

export type DayExercise = {
  id: string;
  day_id: string;
  exercise_id: string;
  sets: number | null;
  reps_min: number | null;
  reps_max: number | null;
  rir: number | null;
  rest_seconds: number | null;
  notes: string | null;
  order_index: number | null;
  exercises: {
    id: string;
    name: string;
    primary_muscle: string | null;
    secondary_muscle: string | null;
  } | null;
};

export async function getExercisesByDay(
  dayId: string
): Promise<DayExercise[]> {
  const { data, error } = await supabase
    .from("exercises_in_day")
    .select(
      `
      *,
      exercises (
        id,
        name,
        primary_muscle,
        secondary_muscle
      )
    `
    )
    .eq("day_id", dayId)
    .order("order_index", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
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

  return data;
}