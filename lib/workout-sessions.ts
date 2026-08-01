"use server";

import { createClient, getUserId } from "@/lib/supabase/server";
import type { ExerciseLog, PlannedExercise, WorkoutSession } from "@/lib/types";

type WorkoutSessionDetail = WorkoutSession & {
  workout_routines: { name: string } | null;
  workout_days: { name: string; order_index?: number } | null;
};

type CompleteWorkoutResult = {
  status: "completed" | "already_completed" | "cancelled";
  session_id: string;
  completed_at: string | null;
  previous_day_index: number | null;
  next_day_index: number | null;
  next_day_name: string | null;
};

type CancelWorkoutResult = {
  status: "cancelled" | "already_cancelled" | "completed";
  session_id: string;
  cancelled_at: string | null;
};

function isCancelledSession(session: Pick<WorkoutSession, "status" | "cancelled_at">) {
  return session.status === "cancelled" || Boolean(session.cancelled_at);
}

export async function getOpenWorkoutSession(): Promise<WorkoutSessionDetail | null> {
  const supabase = await createClient();
  const userId = await getUserId();

  const { data, error } = await supabase
    .from("workout_sessions")
    .select(
      `
      *,
      workout_routines ( name ),
      workout_days ( name, order_index )
    `
    )
    .eq("user_id", userId)
    .eq("status", "in_progress")
    .is("completed_at", null)
    .is("cancelled_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as WorkoutSessionDetail | null;
}

export async function getLatestCompletedSession(): Promise<WorkoutSessionDetail | null> {
  const supabase = await createClient();
  const userId = await getUserId();

  const { data, error } = await supabase
    .from("workout_sessions")
    .select(
      `
      *,
      workout_routines ( name ),
      workout_days ( name, order_index )
    `
    )
    .eq("user_id", userId)
    .eq("status", "completed")
    .not("completed_at", "is", null)
    .is("cancelled_at", null)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as WorkoutSessionDetail | null;
}

export async function createWorkoutSession({
  routineId,
  dayId,
}: {
  routineId: string;
  dayId: string;
}) {
  const supabase = await createClient();
  const userId = await getUserId();
  const openSession = await getOpenWorkoutSession();

  if (openSession) {
    return openSession;
  }

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

  const { data, error } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: userId,
      routine_id: routineId,
      day_id: dayId,
      status: "in_progress",
    })
    .select()
    .single();

  if (error) {
    const existing = await getOpenWorkoutSession();

    if (existing) {
      return existing;
    }

    throw new Error("No se pudo iniciar el entrenamiento. Inténtalo de nuevo.");
  }

  return data as WorkoutSession;
}

export async function getWorkoutSessionById(
  sessionId: string
): Promise<WorkoutSessionDetail | null> {
  const supabase = await createClient();
  const userId = await getUserId();

  const { data, error } = await supabase
    .from("workout_sessions")
    .select(
      `
      *,
      workout_routines ( name ),
      workout_days ( name, order_index )
    `
    )
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as WorkoutSessionDetail | null;
}

export async function getPlannedExercisesForSession(
  session: WorkoutSession
): Promise<PlannedExercise[]> {
  if (!session.day_id || isCancelledSession(session)) {
    return [];
  }

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
      workout_days!inner(workout_routines!inner(user_id))
    `
    )
    .eq("day_id", session.day_id)
    .eq("workout_days.workout_routines.user_id", userId)
    .is("archived_at", null)
    .order("order_index", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as PlannedExercise[];
}

export async function completeWorkoutSession({
  sessionId,
  allowIncomplete = false,
}: {
  sessionId: string;
  allowIncomplete?: boolean;
}): Promise<CompleteWorkoutResult> {
  const supabase = await createClient();
  const session = await getWorkoutSessionById(sessionId);

  if (!session) {
    throw new Error("Sesión no encontrada.");
  }

  if (isCancelledSession(session)) {
    return {
      status: "cancelled",
      session_id: session.id,
      completed_at: session.completed_at,
      previous_day_index: session.completed_day_index ?? null,
      next_day_index: session.resulting_next_day_index ?? null,
      next_day_name: null,
    };
  }

  if (!allowIncomplete && !session.completed_at) {
    const planned = await getPlannedExercisesForSession(session);
    const totalSets = planned.reduce((sum, item) => sum + (item.sets ?? 0), 0);

    const { count, error: countError } = await supabase
      .from("exercise_logs")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionId);

    if (countError) {
      throw new Error(countError.message);
    }

    if ((count ?? 0) < totalSets) {
      throw new Error("Faltan series por guardar. Puedes finalizar igualmente desde la confirmacion.");
    }
  }

  const { data, error } = await supabase.rpc("complete_workout_session_atomic", {
    p_session_id: sessionId,
  });

  if (error) {
    throw new Error(error.message);
  }

  const result = Array.isArray(data) ? data[0] : data;

  if (!result) {
    throw new Error("No se pudo confirmar la finalización.");
  }

  return result as CompleteWorkoutResult;
}

export async function cancelWorkoutSession({
  sessionId,
  reason,
}: {
  sessionId: string;
  reason?: string;
}): Promise<CancelWorkoutResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("cancel_workout_session_atomic", {
    p_session_id: sessionId,
    p_reason: reason ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }

  const result = Array.isArray(data) ? data[0] : data;

  if (!result) {
    throw new Error("No se pudo cancelar el entrenamiento.");
  }

  return result as CancelWorkoutResult;
}

type PreviousExercisePerformance = {
  exerciseId: string;
  sessionId: string;
  startedAt: string;
  routineName: string;
  dayName: string;
  sets: ExerciseLog[];
  bestSet: ExerciseLog | null;
};

export async function getPreviousExercisePerformances({
  exerciseIds,
  currentSessionId,
  currentDayId,
  beforeStartedAt,
}: {
  exerciseIds: string[];
  currentSessionId: string;
  currentDayId: string | null;
  beforeStartedAt: string;
}) {
  if (exerciseIds.length === 0 || !currentDayId) {
    return new Map<string, PreviousExercisePerformance>();
  }

  const supabase = await createClient();
  const userId = await getUserId();

  const { data, error } = await supabase
    .from("exercise_logs")
    .select(
      `
      *,
      workout_sessions!inner (
        id,
        user_id,
        day_id,
        started_at,
        completed_at,
        status,
        cancelled_at,
        workout_routines ( name ),
        workout_days ( name )
      )
    `
    )
    .in("exercise_id", exerciseIds)
    .neq("session_id", currentSessionId)
    .lt("workout_sessions.started_at", beforeStartedAt)
    .eq("workout_sessions.user_id", userId)
    .eq("workout_sessions.day_id", currentDayId)
    .eq("workout_sessions.status", "completed")
    .is("workout_sessions.cancelled_at", null)
    .not("workout_sessions.completed_at", "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as Array<
    ExerciseLog & {
      workout_sessions: {
        id: string;
        day_id: string | null;
        started_at: string;
        completed_at: string | null;
        status: string | null;
        cancelled_at: string | null;
        workout_routines: { name: string } | null;
        workout_days: { name: string } | null;
      };
    }
  >;

  rows.sort((a, b) => {
    const bySessionDate = b.workout_sessions.started_at.localeCompare(a.workout_sessions.started_at);
    return bySessionDate || a.set_number - b.set_number;
  });

  const byExercise = new Map<string, PreviousExercisePerformance>();

  for (const row of rows) {
    const existing = byExercise.get(row.exercise_id);

    if (existing && existing.sessionId !== row.workout_sessions.id) {
      continue;
    }

    if (!existing) {
      byExercise.set(row.exercise_id, {
        exerciseId: row.exercise_id,
        sessionId: row.workout_sessions.id,
        startedAt: row.workout_sessions.started_at,
        routineName: row.workout_sessions.workout_routines?.name ?? "Sin rutina",
        dayName: row.workout_sessions.workout_days?.name ?? "Entrenamiento",
        sets: [],
        bestSet: null,
      });
    }

    const group = byExercise.get(row.exercise_id);

    if (!group) {
      continue;
    }

    group.sets.push(row);
    group.bestSet = group.sets.reduce<ExerciseLog | null>((best, set) => {
      if (!best || set.weight > best.weight || (set.weight === best.weight && set.reps > best.reps)) {
        return set;
      }

      return best;
    }, null);
  }

  for (const group of byExercise.values()) {
    group.sets.sort((a, b) => a.set_number - b.set_number);
  }

  return byExercise;
}
