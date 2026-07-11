import { supabase } from "@/lib/supabase";

export type ExerciseLog = {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  weight: number;
  reps: number;
  rir: number;
  created_at: string;
};

export async function getExerciseLogsBySession(
  sessionId: string
): Promise<ExerciseLog[]> {
  const { data, error } = await supabase
    .from("exercise_logs")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
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

  return data;
}