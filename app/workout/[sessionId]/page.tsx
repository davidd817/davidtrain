import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { WorkoutSessionClient } from "@/components/workout/workout-session-client";
import { getExerciseLogsBySession } from "@/lib/exercise-logs";
import {
  getPlannedExercisesForSession,
  getPreviousExercisePerformances,
  getWorkoutSessionById,
} from "@/lib/workout-sessions";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default async function WorkoutSessionPage({ params }: Props) {
  const { sessionId } = await params;
  const session = await getWorkoutSessionById(sessionId);

  if (!session) {
    notFound();
  }

  if (session.status === "cancelled" || session.cancelled_at) {
    redirect("/dashboard");
  }

  if (session.completed_at || session.status === "completed") {
    redirect(`/history/${session.id}`);
  }

  const [dayExercises, logs] = await Promise.all([
    getPlannedExercisesForSession(session),
    getExerciseLogsBySession(sessionId),
  ]);

  const previous = await getPreviousExercisePerformances({
    exerciseIds: dayExercises.map((item) => item.exercise_id),
    currentSessionId: sessionId,
    currentDayId: session.day_id,
    beforeStartedAt: session.started_at,
  });

  const readOnly = Boolean(session.completed_at);
  const exercises = dayExercises.map((item) => {
    const previousItem = previous.get(item.exercise_id) ?? null;

    return {
      key: item.id,
      exerciseId: item.exercise_id,
      name: item.exercises?.name ?? "Ejercicio",
      targetSets: item.sets ?? 0,
      repsMin: item.reps_min,
      repsMax: item.reps_max,
      targetRir: item.rir,
      restSeconds: item.rest_seconds,
      notes: item.notes,
      youtubeUrl: item.exercises?.youtube_url ?? null,
      videoTitle: item.exercises?.video_title ?? null,
      initialLogs: logs
        .filter((log) => log.exercise_id === item.exercise_id)
        .map((log) => ({
          id: log.id,
          set_number: log.set_number,
          weight: log.weight,
          reps: log.reps,
          rir: log.rir,
        })),
      previous: previousItem
        ? {
            startedAt: previousItem.startedAt,
            routineName: previousItem.routineName,
            dayName: previousItem.dayName,
            sets: previousItem.sets.map((set) => ({
              id: set.id,
              set_number: set.set_number,
              weight: set.weight,
              reps: set.reps,
              rir: set.rir,
            })),
            bestSet: previousItem.bestSet
              ? {
                  id: previousItem.bestSet.id,
                  set_number: previousItem.bestSet.set_number,
                  weight: previousItem.bestSet.weight,
                  reps: previousItem.bestSet.reps,
                  rir: previousItem.bestSet.rir,
                }
              : null,
          }
        : null,
    };
  });

  return (
    <AppShell>
      <header className="mb-5">
        <Link href="/dashboard" className="mb-3 inline-block text-sm text-slate-500">
          Volver
        </Link>
        <p className="text-sm font-medium text-slate-500">
          {session.workout_routines?.name ?? "Sin rutina"}
        </p>
        <h1 className="text-3xl font-bold tracking-tight">
          {session.workout_days?.name ?? "Entrenamiento"}
        </h1>
      </header>

      <WorkoutSessionClient sessionId={sessionId} readOnly={readOnly} exercises={exercises} />
    </AppShell>
  );
}
