"use server";

import { estimateOneRepMax } from "@/lib/format";
import { getWorkoutHistory } from "@/lib/history";
import { createClient, getUserId } from "@/lib/supabase/server";
import type { ExerciseLog } from "@/lib/types";

export type ExerciseProgressSet = ExerciseLog & {
  workout_sessions: {
    id: string;
    started_at: string;
    completed_at: string | null;
    status: string | null;
    cancelled_at: string | null;
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

export type ExerciseProgressSummary = {
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
  latestMark: string;
  trendPercent: number | null;
};

export type ProgressOverview = {
  completedCount: number;
  completedLast30: number;
  setsLast30: number;
  exerciseCount: number;
  weeklyFrequency: number;
  recentWorkouts: Awaited<ReturnType<typeof getWorkoutHistory>>;
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
        status,
        cancelled_at,
        workout_routines ( name ),
        workout_days ( name )
      )
    `
    )
    .eq("workout_sessions.user_id", userId)
    .eq("workout_sessions.status", "completed")
    .is("workout_sessions.cancelled_at", null)
    .not("workout_sessions.completed_at", "is", null)
    .order("created_at", { ascending: false });

  if (exerciseId) {
    query = query.eq("exercise_id", exerciseId);
  }

  if (days) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    query = query.gte("workout_sessions.completed_at", since.toISOString());
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
        latestMark: "Sin marca",
        trendPercent: null,
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

    if (!summary.latestAt || set.workout_sessions.completed_at! > summary.latestAt) {
      summary.latestAt = set.workout_sessions.completed_at;
      summary.latestMark = `${set.weight} kg x ${set.reps}`;
    }
  }

  for (const summary of summaries.values()) {
    const exerciseSets = sets.filter((set) => set.exercise_id === summary.exerciseId);
    const sessionIds = new Set(exerciseSets.map((set) => set.session_id));
    summary.sessionCount = sessionIds.size;
    summary.totalVolume = Math.round(summary.totalVolume * 10) / 10;
    summary.bestEstimatedOneRm = Math.round(summary.bestEstimatedOneRm * 10) / 10;
    summary.trendPercent = calculateTrendPercent(exerciseSets);
  }

  return Array.from(summaries.values()).sort(
    (a, b) => (b.latestAt ?? "").localeCompare(a.latestAt ?? "")
  );
}

export async function getProgressOverview(): Promise<ProgressOverview> {
  const [sessions, summaries, recentSets] = await Promise.all([
    getWorkoutHistory({ status: "completed" }),
    getProgressSummaries(),
    getProgressSets({ days: 30 }),
  ]);

  const now = Date.now();
  const last30Ms = 30 * 24 * 60 * 60 * 1000;
  const completedLast30 = sessions.filter((session) => {
    const value = session.completed_at ?? session.started_at;
    return now - new Date(value).getTime() <= last30Ms;
  }).length;

  return {
    completedCount: sessions.length,
    completedLast30,
    setsLast30: recentSets.length,
    exerciseCount: summaries.length,
    weeklyFrequency: Math.round((completedLast30 / (30 / 7)) * 10) / 10,
    recentWorkouts: sessions.slice(0, 5),
  };
}

export async function getExerciseProgress(exerciseId: string) {
  const sets = await getProgressSets({ exerciseId });
  const summaries = await getProgressSummaries();

  return {
    summary: summaries.find((item) => item.exerciseId === exerciseId) ?? null,
    sets,
  };
}

function calculateTrendPercent(sets: ExerciseProgressSet[]) {
  const bySession = groupBySession(sets);
  const points = Object.values(bySession)
    .map((session) => ({
      at: session.completedAt,
      value: Math.max(...session.sets.map((set) => estimateOneRepMax(set.weight, set.reps))),
    }))
    .filter((point) => Number.isFinite(point.value) && point.value > 0)
    .sort((a, b) => a.at.localeCompare(b.at));

  if (points.length < 2 || points[0].value <= 0) {
    return null;
  }

  const first = points[0].value;
  const last = points[points.length - 1].value;
  return Math.round(((last - first) / first) * 1000) / 10;
}

function groupBySession(sets: ExerciseProgressSet[]) {
  return sets.reduce<
    Record<
      string,
      {
        sessionId: string;
        startedAt: string;
        completedAt: string;
        routineName: string;
        dayName: string;
        sets: ExerciseProgressSet[];
      }
    >
  >((acc, set) => {
    const session = set.workout_sessions;
    const key = set.session_id;

    if (!acc[key]) {
      acc[key] = {
        sessionId: key,
        startedAt: session.started_at,
        completedAt: session.completed_at ?? session.started_at,
        routineName: session.workout_routines?.name ?? "Sin rutina",
        dayName: session.workout_days?.name ?? "Entrenamiento",
        sets: [],
      };
    }

    acc[key].sets.push(set);
    return acc;
  }, {});
}
