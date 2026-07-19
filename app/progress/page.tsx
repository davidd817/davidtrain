import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { formatDateTime } from "@/lib/format";
import { getWorkoutHistory } from "@/lib/history";
import { getProgressSummaries } from "@/lib/progress";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const [sessions, progress] = await Promise.all([
    getWorkoutHistory(),
    getProgressSummaries(),
  ]);

  const completed = sessions.filter((session) => session.completed_at);
  const open = sessions.filter((session) => !session.completed_at);

  return (
    <AppShell>
      <header className="mb-5">
        <p className="text-sm font-medium text-slate-500">Historial y PRs</p>
        <h1 className="text-3xl font-bold tracking-tight">Progreso</h1>
      </header>

      <div className="space-y-5">
        <section className="grid grid-cols-3 gap-2">
          <Stat label="Sesiones" value={String(sessions.length)} />
          <Stat label="Completadas" value={String(completed.length)} />
          <Stat label="Abiertas" value={String(open.length)} />
        </section>

        <section className="space-y-3">
          <div className="flex items-end justify-between">
            <h2 className="text-lg font-bold">PRs recientes</h2>
            <span className="text-sm text-slate-500">{progress.length} ejercicios</span>
          </div>

          {progress.length === 0 ? (
            <div className="rounded-2xl border bg-white p-4 text-sm text-slate-500">
              Registra series para empezar a ver progreso real.
            </div>
          ) : (
            progress.slice(0, 8).map((item) => (
              <Link
                key={item.exerciseId}
                href={`/progress/${item.exerciseId}`}
                className="block rounded-2xl border bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold">{item.exerciseName}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.primaryMuscle ?? "Sin grupo"} - {item.sessionCount} sesiones
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  <Info label="Peso" value={`${item.bestWeight} kg`} />
                  <Info label="Reps" value={String(item.bestReps)} />
                  <Info label="1RM est." value={`${item.bestEstimatedOneRm} kg`} />
                </div>
              </Link>
            ))
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold">Historial</h2>

          {sessions.length === 0 ? (
            <div className="rounded-2xl border bg-white p-4 text-sm text-slate-500">
              Aun no tienes sesiones registradas.
            </div>
          ) : (
            sessions.map((session) => (
              <Link
                key={session.id}
                href={`/history/${session.id}`}
                className="block rounded-2xl border bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold">{session.workout_days?.name ?? "Entrenamiento"}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {session.workout_routines?.name ?? "Sin rutina"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatDateTime(session.started_at)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      session.completed_at
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {session.completed_at ? "Completada" : "Abierta"}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <Info label="Ejercicios" value={String(session.exercise_count)} />
                  <Info label="Series" value={String(session.set_count)} />
                </div>
              </Link>
            ))
          )}
        </section>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white p-3 text-center shadow-sm">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-2">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
