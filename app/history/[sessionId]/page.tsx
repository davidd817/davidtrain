import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { formatDateTime, formatDuration } from "@/lib/format";
import { getWorkoutSessionDetail } from "@/lib/history";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default async function HistoryDetailPage({ params }: Props) {
  const { sessionId } = await params;
  const detail = await getWorkoutSessionDetail(sessionId);

  if (!detail) {
    notFound();
  }

  const { session, logs } = detail;
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
      <header className="mb-5">
        <Link href="/progress" className="mb-3 inline-block text-sm text-slate-500">
          Volver al historial
        </Link>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-500">
              {session.workout_routines?.name || "Sin rutina"}
            </p>
            <h1 className="text-3xl font-bold tracking-tight">
              {session.workout_days?.name || "Entrenamiento"}
            </h1>
          </div>
          {!session.completed_at ? (
            <Link
              href={`/workout/${session.id}`}
              className="rounded-xl bg-amber-600 px-3 py-2 text-sm font-semibold text-white"
            >
              Continuar
            </Link>
          ) : null}
        </div>
        <p className="mt-2 text-sm text-slate-500">{formatDateTime(session.started_at)}</p>
      </header>

      <section className="mb-5 grid grid-cols-3 gap-2">
        <Stat label="Duracion" value={formatDuration(session.duration_seconds)} />
        <Stat label="Ejercicios" value={String(session.exercise_count)} />
        <Stat label="Series" value={String(session.set_count)} />
      </section>

      <section className="space-y-4">
        {Object.values(groupedLogs).length === 0 ? (
          <div className="rounded-2xl border bg-white p-4 text-sm text-slate-500">
            Esta sesion no tiene series guardadas.
          </div>
        ) : (
          Object.values(groupedLogs).map((group) => (
            <article key={group.exerciseName} className="rounded-2xl border bg-white p-4 shadow-sm">
              <h2 className="text-lg font-bold">{group.exerciseName}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {group.primaryMuscle || "Sin grupo"}
                {group.secondaryMuscle ? ` - ${group.secondaryMuscle}` : ""}
              </p>

              <div className="mt-4 space-y-2">
                {group.sets
                  .sort((a, b) => a.set_number - b.set_number)
                  .map((set) => (
                    <div
                      key={set.id}
                      className="grid grid-cols-4 rounded-xl bg-slate-50 px-3 py-2 text-sm"
                    >
                      <span className="font-semibold">S{set.set_number}</span>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white p-3 text-center shadow-sm">
      <p className="text-sm font-bold">{value}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  );
}
