import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { estimateOneRepMax, formatDateTime } from "@/lib/format";
import { getExerciseById } from "@/lib/exercises";
import { getExerciseProgress } from "@/lib/progress";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    exerciseId: string;
  }>;
};

export default async function ExerciseProgressPage({ params }: Props) {
  const { exerciseId } = await params;
  const [exercise, progress] = await Promise.all([
    getExerciseById(exerciseId),
    getExerciseProgress(exerciseId),
  ]);

  if (!exercise) {
    notFound();
  }

  const grouped = progress.sets.reduce<
    Record<
      string,
      {
        startedAt: string;
        routineName: string;
        dayName: string;
        sets: typeof progress.sets;
      }
    >
  >((acc, set) => {
    const key = set.session_id;

    if (!acc[key]) {
      acc[key] = {
        startedAt: set.workout_sessions.started_at,
        routineName: set.workout_sessions.workout_routines?.name ?? "Sin rutina",
        dayName: set.workout_sessions.workout_days?.name ?? "Entrenamiento",
        sets: [],
      };
    }

    acc[key].sets.push(set);
    return acc;
  }, {});

  return (
    <AppShell>
      <header className="mb-5">
        <Link href="/progress" className="mb-3 inline-block text-sm text-slate-500">
          Volver a progreso
        </Link>
        <p className="text-sm font-medium text-slate-500">
          {exercise.primary_muscle ?? "Sin grupo"}
        </p>
        <h1 className="text-3xl font-bold tracking-tight">{exercise.name}</h1>
      </header>

      <div className="space-y-5">
        <section className="grid grid-cols-2 gap-2">
          <Stat label="Sesiones" value={String(progress.summary?.sessionCount ?? 0)} />
          <Stat label="Series" value={String(progress.summary?.setCount ?? 0)} />
          <Stat label="Mayor peso" value={`${progress.summary?.bestWeight ?? 0} kg`} />
          <Stat label="1RM est." value={`${progress.summary?.bestEstimatedOneRm ?? 0} kg`} />
        </section>

        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="font-bold">Formula usada</h2>
          <p className="mt-1 text-sm text-slate-500">
            1RM estimado con Epley: peso x (1 + reps / 30). Es una referencia, no una
            prediccion exacta.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold">Cronologia</h2>
          {Object.values(grouped).length === 0 ? (
            <div className="rounded-2xl border bg-white p-4 text-sm text-slate-500">
              Este ejercicio aun no tiene series registradas.
            </div>
          ) : (
            Object.values(grouped).map((session) => (
              <article key={session.startedAt} className="rounded-2xl border bg-white p-4 shadow-sm">
                <h3 className="font-bold">{session.dayName}</h3>
                <p className="mt-1 text-sm text-slate-500">{session.routineName}</p>
                <p className="mt-1 text-xs text-slate-400">{formatDateTime(session.startedAt)}</p>
                <div className="mt-3 space-y-2">
                  {session.sets
                    .sort((a, b) => a.set_number - b.set_number)
                    .map((set) => (
                      <div
                        key={set.id}
                        className="grid grid-cols-4 rounded-xl bg-slate-50 px-3 py-2 text-sm"
                      >
                        <span className="font-semibold">S{set.set_number}</span>
                        <span>{set.weight} kg</span>
                        <span>{set.reps} reps</span>
                        <span>{estimateOneRepMax(set.weight, set.reps)} e1RM</span>
                      </div>
                    ))}
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}
