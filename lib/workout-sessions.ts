import { supabase } from "@/lib/supabase";
import { DEV_USER_ID } from "@/lib/config";
import { getTrainingState } from "@/lib/training-state";
import { getDaysByRoutine } from "@/lib/workout-days";

export async function createWorkoutSession({
  routineId,
  dayId,
}: {
  routineId: string;
  dayId: string;
}) {
  const { data, error } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: DEV_USER_ID,
      routine_id: routineId,
      day_id: dayId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function completeWorkoutSession({
  sessionId,
}: {
  sessionId: string;
}) {
  const { data: session, error: sessionError } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  const { error: updateSessionError } = await supabase
    .from("workout_sessions")
    .update({
      completed_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  if (updateSessionError) {
    throw new Error(updateSessionError.message);
  }

  const state = await getTrainingState();

  if (!state?.active_routine_id) {
    return;
  }

  const days = await getDaysByRoutine(state.active_routine_id);

  if (days.length === 0) {
    return;
  }

  const currentIndex = days.findIndex((day) => day.id === session.day_id);

  const nextIndex =
    currentIndex === -1 ? state.next_day_index : (currentIndex + 1) % days.length;

  const { error: stateError } = await supabase
    .from("user_training_state")
    .update({
      next_day_index: nextIndex,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", DEV_USER_ID);

  if (stateError) {
    throw new Error(stateError.message);
  }
}