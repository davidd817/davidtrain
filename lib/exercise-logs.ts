"use server";

import { createClient, getUserId } from "@/lib/supabase/server";
import type { ExerciseLog } from "@/lib/types";

export async function getExerciseLogsBySession(sessionId: string): Promise<ExerciseLog[]> {
  const supabase = await createClient();
  const userId = await getUserId();

  const { data, error } = await supabase
    .from("exercise_logs")
    .select("*, workout_sessions!inner(user_id)")
    .eq("session_id", sessionId)
    .eq("workout_sessions.user_id", userId)
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
  const supabase = await createClient();
  const userId = await getUserId();

  const { data: session, error: sessionError } = await supabase
    .from("workout_sessions")
    .select("id, completed_at")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  if (!session) {
    throw new Error("Sesion no encontrada.");
  }

  if (session.completed_at) {
    throw new Error("No se puede editar una sesion finalizada.");
  }

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
