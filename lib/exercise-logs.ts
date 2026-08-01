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

type SaveExerciseSetInput = {
  setNumber: number;
  weight: number;
  reps: number;
  rir: number;
};

async function assertEditableSessionExercise({
  sessionId,
  exerciseId,
}: {
  sessionId: string;
  exerciseId: string;
}) {
  const supabase = await createClient();
  const userId = await getUserId();

  const { data: session, error: sessionError } = await supabase
    .from("workout_sessions")
    .select("id, day_id, completed_at, status, cancelled_at")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  if (!session) {
    throw new Error("Sesion no encontrada.");
  }

  if (session.completed_at || session.status === "completed") {
    throw new Error("No se puede editar una sesion finalizada.");
  }

  if (session.cancelled_at || session.status === "cancelled") {
    throw new Error("No se puede editar una sesion cancelada.");
  }

  if (!session.day_id) {
    throw new Error("La sesion no tiene dia asociado.");
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

  const { data: planned, error: plannedError } = await supabase
    .from("exercises_in_day")
    .select("id, workout_days!inner(workout_routines!inner(user_id))")
    .eq("day_id", session.day_id)
    .eq("exercise_id", exerciseId)
    .eq("workout_days.workout_routines.user_id", userId)
    .is("archived_at", null)
    .limit(1)
    .maybeSingle();

  if (plannedError) {
    throw new Error(plannedError.message);
  }

  if (!planned) {
    throw new Error("Este ejercicio no pertenece al dia de la sesion.");
  }
}

function assertValidSet(set: SaveExerciseSetInput) {
  if (!Number.isInteger(set.setNumber) || set.setNumber < 1 || set.setNumber > 50) {
    throw new Error("Numero de serie no valido.");
  }

  if (!Number.isFinite(set.weight) || set.weight < 0 || set.weight > 1000) {
    throw new Error("Peso: debe estar entre 0 y 1000.");
  }

  if (!Number.isInteger(set.reps) || set.reps < 1 || set.reps > 100) {
    throw new Error("Reps: debe estar entre 1 y 100.");
  }

  if (!Number.isInteger(set.rir) || set.rir < 0 || set.rir > 10) {
    throw new Error("RIR: debe estar entre 0 y 10.");
  }
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
  await assertEditableSessionExercise({ sessionId, exerciseId });
  assertValidSet({ setNumber, weight, reps, rir });

  const supabase = await createClient();
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

export async function saveExerciseSets({
  sessionId,
  exerciseId,
  sets,
}: {
  sessionId: string;
  exerciseId: string;
  sets: SaveExerciseSetInput[];
}) {
  await assertEditableSessionExercise({ sessionId, exerciseId });

  for (const set of sets) {
    assertValidSet(set);
  }

  const supabase = await createClient();
  const setNumbers = sets.map((set) => set.setNumber);

  if (sets.length === 0) {
    const { error } = await supabase
      .from("exercise_logs")
      .delete()
      .eq("session_id", sessionId)
      .eq("exercise_id", exerciseId);

    if (error) {
      throw new Error(error.message);
    }

    return [];
  }

  const rows = sets.map((set) => ({
    session_id: sessionId,
    exercise_id: exerciseId,
    set_number: set.setNumber,
    weight: set.weight,
    reps: set.reps,
    rir: set.rir,
  }));

  const { data, error } = await supabase
    .from("exercise_logs")
    .upsert(rows, {
      onConflict: "session_id,exercise_id,set_number",
    })
    .select();

  if (error) {
    throw new Error(error.message);
  }

  const { error: staleError } = await supabase
    .from("exercise_logs")
    .delete()
    .eq("session_id", sessionId)
    .eq("exercise_id", exerciseId)
    .not("set_number", "in", `(${setNumbers.join(",")})`);

  if (staleError) {
    throw new Error(staleError.message);
  }

  return (data ?? []) as ExerciseLog[];
}