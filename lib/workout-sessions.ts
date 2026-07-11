import { DEV_USER_ID } from "@/lib/config";
import { getTrainingState } from "@/lib/training-state";
import { supabase } from "@/lib/supabase";
import { getDaysByRoutine } from "@/lib/workout-days";
import { secondsBetween } from "@/lib/format";
import type { ExerciseLog, PlannedExercise, WorkoutSession } from "@/lib/types";

export type WorkoutSessionDetail = WorkoutSession & {
  workout_routines: { name: string } | null;
  workout_days: { name: string; order_index?: number } | null;
};

export async function getOpenWorkoutSession(): Promise<WorkoutSessionDetail | null> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .select(
      `
      *,
      workout_routines ( name ),
      workout_days ( name, order_index )
    `
    )
    .eq("user_id", DEV_USER_ID)
    .is("completed_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as WorkoutSessionDetail | null;
}

export async function getLatestCompletedSession(): Promise<WorkoutSessionDetail | null> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .select(
      `
      *,
      workout_routines ( name ),
      workout_days ( name, order_index )
    `
    )
    .eq("user_id", DEV_USER_ID)
    .not("completed_at", "is", null)
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
  const openSession = await getOpenWorkoutSession();

  if (openSession) {
    return openSession;
  }

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

  return data as WorkoutSession;
}

export async function getWorkoutSessionById(
  sessionId: string
): Promise<WorkoutSessionDetail | null> {
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
    .eq("user_id", DEV_USER_ID)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as WorkoutSessionDetail | null;
}

export async function getPlannedExercisesForSession(
  session: WorkoutSession
): Promise<PlannedExercise[]> {
  if (!session.day_id) {
    return [];
  }

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
        notes
      )
    `
    )
    .eq("day_id", session.day_id)
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
}) {
  const session = await getWorkoutSessionById(sessionId);

  if (!session) {
    throw new Error("Sesion no encontrada.");
  }

  if (session.completed_at) {
    return;
  }

  if (!allowIncomplete) {
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

  const completedAt = new Date().toISOString();
  const { error: updateSessionError } = await supabase
    .from("workout_sessions")
    .update({
      completed_at: completedAt,
      duration_seconds: secondsBetween(session.started_at, completedAt),
    })
    .eq("id", sessionId)
    .eq("user_id", DEV_USER_ID)
    .is("completed_at", null);

  if (updateSessionError) {
    throw new Error(updateSessionError.message);
  }

  await advanceTrainingDayOnce(session);
}

async function advanceTrainingDayOnce(session: WorkoutSessionDetail) {
  if (session.completed_day_advanced_at) {
    return;
  }

  const state = await getTrainingState();

  if (!state?.active_routine_id || state.active_routine_id !== session.routine_id) {
    return;
  }

  const days = await getDaysByRoutine(state.active_routine_id);

  if (days.length === 0) {
    return;
  }

  const currentIndex = days.findIndex((day) => day.id === session.day_id);
  const nextIndex =
    currentIndex === -1 ? state.next_day_index : (currentIndex + 1) % days.length;
  const now = new Date().toISOString();

  const [{ error: stateError }, { error: sessionError }] = await Promise.all([
    supabase
      .from("user_training_state")
      .update({
        next_day_index: nextIndex,
        updated_at: now,
      })
      .eq("user_id", DEV_USER_ID),
    supabase
      .from("workout_sessions")
      .update({ completed_day_advanced_at: now })
      .eq("id", session.id)
      .eq("user_id", DEV_USER_ID)
      .is("completed_day_advanced_at", null),
  ]);

  if (stateError) {
    throw new Error(stateError.message);
  }

  if (sessionError) {
    throw new Error(sessionError.message);
  }
}

export type PreviousExercisePerformance = {
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
  beforeStartedAt,
}: {
  exerciseIds: string[];
  currentSessionId: string;
  beforeStartedAt: string;
}) {
  if (exerciseIds.length === 0) {
    return new Map<string, PreviousExercisePerformance>();
  }

  const { data, error } = await supabase
    .from("exercise_logs")
    .select(
      `
      *,
      workout_sessions!inner (
        id,
        started_at,
        workout_routines ( name ),
        workout_days ( name )
      )
    `
    )
    .in("exercise_id", exerciseIds)
    .neq("session_id", currentSessionId)
    .lt("workout_sessions.started_at", beforeStartedAt)
    .eq("workout_sessions.user_id", DEV_USER_ID)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as Array<ExerciseLog & {
    workout_sessions: {
      id: string;
      started_at: string;
      workout_routines: { name: string } | null;
      workout_days: { name: string } | null;
    };
  }>;

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
      if (!best) {
        return set;
      }

      if (set.weight > best.weight) {
        return set;
      }

      if (set.weight === best.weight && set.reps > best.reps) {
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
