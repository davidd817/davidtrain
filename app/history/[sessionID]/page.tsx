import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { getWorkoutSessionDetail } from "@/lib/history";

type Props = {
  params: Promise<{
    sessionId: string;
  }>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function HistoryDetailPage({ params }: Props) {
  const { sessionId } = await params;

  const { session, logs } = await getWorkoutSessionDetail(sessionId);

  const groupedLogs = logs.reduce<
    Record<
      string,
      {
        exerciseName: string;
        primaryMuscle: string | null;
        secondaryMuscle: string | null;
        sets: typeof logs;
      }
    >
  >((acc, log) => {
    const exerciseId = log.exercise_id;

    if (!acc[exerciseId]) {
      acc[exerciseId] = {
        exerciseName: log.exercises?.name || "Ejercicio",
        primaryMuscle: log.exercises?.primary_muscle ?? null,
        secondaryMuscle: log.exercises?.secondary_muscle ?? null,
        sets: [],
      };
    }

    acc[exerciseId].sets.push(log);

    return acc;
  }, {});

  return (
    <AppShell>
      <header className="mb-6">
        <Link
          href="/progress"
          className="mb-3 inline-block text-sm text-slate-500"
        >
          ← Volver al historial
        </Link>

        <h1 className="text-2xl font-bold">
          {session.workout_days?.name || "Entrenamiento"}
        </h1>

        <p className="text-sm text-slate-500">
          {session.workout_routines?.name || "Sin rutina"}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          {formatDate(session.started_at)}
        </p>
      </header>

      <section className="space-y-4">
        {Object.values(groupedLogs).length === 0 ? (
          <div className="rounded-2xl border bg-white p-4 text-sm text-slate-500">
            Esta sesión no tiene series guardadas.
          </div>
        ) : (
          Object.values(groupedLogs).map((group) => (
            <article
              key={group.exerciseName}
              className="rounded-2xl border bg-white p-4 shadow-sm"
            >
              <h2 className="text-lg font-semibold">{group.exerciseName}</h2>

              <p className="mt-1 text-sm text-slate-500">
                {group.primaryMuscle || "Sin grupo"}
                {group.secondaryMuscle ? ` · ${group.secondaryMuscle}` : ""}
              </p>

              <div className="mt-4 space-y-2">
                {group.sets
                  .sort((a, b) => a.set_number - b.set_number)
                  .map((set) => (
                    <div
                      key={set.id}
                      className="grid grid-cols-4 rounded-xl bg-slate-50 px-3 py-2 text-sm"
                    >
                      <span className="font-medium">S{set.set_number}</span>
                      <span>{set.weight} kg</span>
                      <span>{set.reps} reps</span>
                      <span>RIR {set.rir}</span>
                    </div>
                  ))}
              </div>
            </article>
          ))
        )}
      </section>
    </AppShell>
  );
}