import { DEV_USER_ID } from "@/lib/config";
import { supabase } from "@/lib/supabase";

export type WorkoutSessionHistoryItem = {
  id: string;
  started_at: string;
  completed_at: string | null;
  routine_id: string | null;
  day_id: string | null;
  workout_routines: {
    name: string;
  } | null;
  workout_days: {
    name: string;
  } | null;
};

export async function getWorkoutHistory(): Promise<WorkoutSessionHistoryItem[]> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .select(
      `
      id,
      started_at,
      completed_at,
      routine_id,
      day_id,
      workout_routines (
        name
      ),
      workout_days (
        name
      )
    `
    )
    .eq("user_id", DEV_USER_ID)
    .order("started_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getWorkoutSessionDetail(sessionId: string) {
  const { data: session, error: sessionError } = await supabase
    .from("workout_sessions")
    .select(
      `
      *,
      workout_routines (
        name
      ),
      workout_days (
        name
      )
    `
    )
    .eq("id", sessionId)
    .single();

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  const { data: logs, error: logsError } = await supabase
    .from("exercise_logs")
    .select(
      `
      *,
      exercises (
        name,
        primary_muscle,
        secondary_muscle
      )
    `
    )
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (logsError) {
    throw new Error(logsError.message);
  }

  return {
    session,
    logs: logs ?? [],
  };
}