"use server";

import { estimateOneRepMax } from "@/lib/format";
import { createClient, getUserId } from "@/lib/supabase/server";
import type { ExerciseLog } from "@/lib/types";

type ExerciseProgressSet = ExerciseLog & {
  workout_sessions: {
    id: string;
    started_at: string;
    completed_at: string | null;
    workout_routines: { name: string } | null;
    workout_days: { name: string } | null;
  };
  exercises: {
    id: string;
    name: string;
    primary_muscle: string | null;
    secondary_muscle: string | null;
  } | null;
};

type ExerciseProgressSummary = {
  exerciseId: string;
  exerciseName: string;
  primaryMuscle: string | null;
  sessionCount: number;
  setCount: number;
  totalVolume: number;
  bestWeight: number;
  bestReps: number;
  bestEstimatedOneRm: number;
  latestAt: string | null;
};

export async function getProgressSets({
  exerciseId,
  days,
}: {
  exerciseId?: string;
  days?: number;
} = {}): Promise<ExerciseProgressSet[]> {
  const supabase = await createClient();
  const userId = await getUserId();

  let query = supabase
    .from("exercise_logs")
    .select(
      `
      *,
      exercises (
        id,
        name,
        primary_muscle,
        secondary_muscle
      ),
      workout_sessions!inner (
        id,
        user_id,
        started_at,
        completed_at,
        workout_routines ( name ),
        workout_days ( name )
      )
    `
    )
    .eq("workout_sessions.user_id", userId)
    .order("created_at", { ascending: false });

  if (exerciseId) {
    query = query.eq("exercise_id", exerciseId);
  }

  if (days) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    query = query.gte("workout_sessions.started_at", since.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ExerciseProgressSet[];
}

export async function getProgressSummaries({
  days,
}: {
  days?: number;
} = {}): Promise<ExerciseProgressSummary[]> {
  const sets = await getProgressSets({ days });
  const summaries = new Map<string, ExerciseProgressSummary>();

  for (const set of sets) {
    const oneRm = estimateOneRepMax(set.weight, set.reps);

    if (!summaries.has(set.exercise_id)) {
      summaries.set(set.exercise_id, {
        exerciseId: set.exercise_id,
        exerciseName: set.exercises?.name ?? "Ejercicio",
        primaryMuscle: set.exercises?.primary_muscle ?? null,
        sessionCount: 0,
        setCount: 0,
        totalVolume: 0,
        bestWeight: 0,
        bestReps: 0,
        bestEstimatedOneRm: 0,
        latestAt: null,
      });
    }

    const summary = summaries.get(set.exercise_id);

    if (!summary) {
      continue;
    }

    summary.setCount += 1;
    summary.totalVolume += set.weight * set.reps;
    summary.bestWeight = Math.max(summary.bestWeight, set.weight);
    summary.bestReps = Math.max(summary.bestReps, set.reps);
    summary.bestEstimatedOneRm = Math.max(summary.bestEstimatedOneRm, oneRm);

    if (!summary.latestAt || set.workout_sessions.started_at > summary.latestAt) {
      summary.latestAt = set.workout_sessions.started_at;
    }
  }

  for (const summary of summaries.values()) {
    const sessionIds = new Set(
      sets
        .filter((set) => set.exercise_id === summary.exerciseId)
        .map((set) => set.session_id)
    );
    summary.sessionCount = sessionIds.size;
    summary.totalVolume = Math.round(summary.totalVolume * 10) / 10;
    summary.bestEstimatedOneRm = Math.round(summary.bestEstimatedOneRm * 10) / 10;
  }

  return Array.from(summaries.values()).sort(
    (a, b) => (b.latestAt ?? "").localeCompare(a.latestAt ?? "")
  );
}

export async function getExerciseProgress(exerciseId: string) {
  const sets = await getProgressSets({ exerciseId });
  const summaries = await getProgressSummaries();

  return {
    summary: summaries.find((item) => item.exerciseId === exerciseId) ?? null,
    sets,
  };
}
