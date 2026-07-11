import { supabase } from "@/lib/supabase";
import type { ExerciseLog } from "@/lib/types";

export type { ExerciseLog };

export async function getExerciseLogsBySession(sessionId: string): Promise<ExerciseLog[]> {
  const { data, error } = await supabase
    .from("exercise_logs")
    .select("*")
    .eq("session_id", sessionId)
    .order("exercise_id", { ascending: true })
    .order("set_number", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ExerciseLog[];
}

export async function saveExerciseSet({
  sessionId,
  exerciseId,
  setNumber,
  weight,
  reps,
  rir,
}: {
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
  rir: number;
}) {
  const { data, error } = await supabase
    .from("exercise_logs")
    .upsert(
      {
        session_id: sessionId,
        exercise_id: exerciseId,
        set_number: setNumber,
        weight,
        reps,
        rir,
      },
      {
        onConflict: "session_id,exercise_id,set_number",
      }
    )
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as ExerciseLog;
}
