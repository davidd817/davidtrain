"use server";

import { secondsBetween } from "@/lib/format";
import { createClient, getUserId } from "@/lib/supabase/server";
import type { ExerciseLog } from "@/lib/types";

type WorkoutSessionHistoryItem = {
  id: string;
  started_at: string;
  completed_at: string | null;
  routine_id: string | null;
  day_id: string | null;
  duration_seconds: number | null;
  workout_routines: { name: string } | null;
  workout_days: { name: string } | null;
  exercise_count: number;
  set_count: number;
};

type WorkoutSessionDetail = {
  session: WorkoutSessionHistoryItem;
  logs: Array<
    ExerciseLog & {
      exercises: {
        name: string;
        primary_muscle: string | null;
        secondary_muscle: string | null;
      } | null;
    }
  >;
};

function normalizeRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export async function getWorkoutHistory({
  status = "all",
}: {
  status?: "all" | "completed" | "open";
} = {}): Promise<WorkoutSessionHistoryItem[]> {
  const supabase = await createClient();
  const userId = await getUserId();

  let query = supabase
    .from("workout_sessions")
    .select(
      `
      id,
      started_at,
      completed_at,
      routine_id,
      day_id,
      duration_seconds,
      workout_routines ( name ),
      workout_days ( name )
    `
    )
    .eq("user_id", userId)
    .order("started_at", { ascending: false });

  if (status === "completed") {
    query = query.not("completed_at", "is", null);
  }

  if (status === "open") {
    query = query.is("completed_at", null);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const sessions = (data ?? []) as Array<
    Omit<
      WorkoutSessionHistoryItem,
      "workout_routines" | "workout_days" | "exercise_count" | "set_count"
    > & {
      workout_routines: { name: string } | { name: string }[] | null;
      workout_days: { name: string } | { name: string }[] | null;
    }
  >;

  if (sessions.length === 0) {
    return [];
  }

  const sessionIds = sessions.map((session) => session.id);

  const { data: logs, error: logsError } = await supabase
    .from("exercise_logs")
    .select("session_id,exercise_id")
    .in("session_id", sessionIds);

  if (logsError) {
    throw new Error(logsError.message);
  }

  return sessions.map((session) => {
    const sessionLogs = (logs ?? []).filter((log) => log.session_id === session.id);
    const exercises = new Set(sessionLogs.map((log) => log.exercise_id));

    return {
      ...session,
      duration_seconds:
        session.duration_seconds ?? secondsBetween(session.started_at, session.completed_at),
      workout_routines: normalizeRelation(session.workout_routines),
      workout_days: normalizeRelation(session.workout_days),
      exercise_count: exercises.size,
      set_count: sessionLogs.length,
    };
  });
}

export async function getWorkoutSessionDetail(
  sessionId: string
): Promise<WorkoutSessionDetail | null> {
  const supabase = await createClient();
  const history = await getWorkoutHistory();
  const session = history.find((item) => item.id === sessionId) ?? null;

  if (!session) {
    return null;
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
    logs: (logs ?? []) as WorkoutSessionDetail["logs"],
  };
}
