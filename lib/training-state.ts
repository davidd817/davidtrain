"use server";

import { createClient, getUserId } from "@/lib/supabase/server";

type TrainingState = {
  user_id: string;
  active_routine_id: string | null;
  next_day_index: number;
};

export async function getTrainingState(): Promise<TrainingState | null> {
  const supabase = await createClient();
  const userId = await getUserId();

  const { data, error } = await supabase
    .from("user_training_state")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as TrainingState | null;
}

export async function setActiveRoutine({
  routineId,
  nextDayIndex = 0,
}: {
  routineId: string;
  nextDayIndex?: number;
}) {
  const supabase = await createClient();
  const userId = await getUserId();

  const { data: routine, error: routineError } = await supabase
    .from("workout_routines")
    .select("id")
    .eq("id", routineId)
    .eq("user_id", userId)
    .maybeSingle();

  if (routineError) {
    throw new Error(routineError.message);
  }

  if (!routine) {
    throw new Error("Rutina no encontrada.");
  }

  const { error } = await supabase.from("user_training_state").upsert(
    {
      user_id: userId,
      active_routine_id: routineId,
      next_day_index: nextDayIndex,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function clearActiveRoutine() {
  const supabase = await createClient();
  const userId = await getUserId();

  const { error } = await supabase
    .from("user_training_state")
    .update({
      active_routine_id: null,
      next_day_index: 0,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}
