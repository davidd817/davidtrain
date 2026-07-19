"use server";

import { createClient, getUserId } from "@/lib/supabase/server";
import { getDaysByRoutine } from "@/lib/workout-days";

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
export async function skipCurrentTrainingDay(reason?: string) {
  const supabase = await createClient();
  const userId = await getUserId();

  const state = await getTrainingState();

  if (!state?.active_routine_id) {
    throw new Error("No hay una rutina activa para saltar.");
  }

  const { data: openSession, error: openSessionError } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("user_id", userId)
    .is("completed_at", null)
    .limit(1)
    .maybeSingle();

  if (openSessionError) {
    throw new Error(openSessionError.message);
  }

  if (openSession) {
    throw new Error("Hay una sesion abierta. Continuala o finalizala antes de saltar el dia.");
  }

  const days = await getDaysByRoutine(state.active_routine_id);

  if (days.length === 0) {
    throw new Error("La rutina activa no tiene dias configurados.");
  }

  const currentDay = days[state.next_day_index] ?? days[0];
  const currentIndex = days.findIndex((day) => day.id === currentDay.id);
  const nextDayIndex = (Math.max(0, currentIndex) + 1) % days.length;
  const skippedAt = new Date().toISOString();

  const { error: skipError } = await supabase.from("workout_day_skips").insert({
    user_id: userId,
    routine_id: state.active_routine_id,
    day_id: currentDay.id,
    skipped_at: skippedAt,
    reason: reason?.trim() || null,
  });

  if (skipError) {
    throw new Error(skipError.message);
  }

  const { error: updateError } = await supabase
    .from("user_training_state")
    .update({
      next_day_index: nextDayIndex,
      updated_at: skippedAt,
    })
    .eq("user_id", userId)
    .eq("active_routine_id", state.active_routine_id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return {
    skippedDayName: currentDay.name,
    nextDayName: days[nextDayIndex]?.name ?? days[0]?.name ?? "siguiente dia",
  };
}
