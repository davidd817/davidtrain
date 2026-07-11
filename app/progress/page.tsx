import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { getWorkoutHistory } from "@/lib/history";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function ProgressPage() {
  const sessions = await getWorkoutHistory();

  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Historial</h1>
        <p className="text-sm text-slate-500">
          Revisa tus entrenamientos anteriores
        </p>
      </header>

      <section className="space-y-3">
        {sessions.length === 0 ? (
          <div className="rounded-2xl border bg-white p-4 text-sm text-slate-500">
            Aún no tienes sesiones registradas.
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
                  <h2 className="font-semibold">
                    {session.workout_days?.name || "Entrenamiento"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {session.workout_routines?.name || "Sin rutina"}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {formatDate(session.started_at)}
                  </p>
                </div>

                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    session.completed_at
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {session.completed_at ? "Completada" : "Abierta"}
                </span>
              </div>

              <p className="mt-3 text-sm font-medium text-slate-900">
                Ver detalle →
              </p>
            </Link>
          ))
        )}
      </section>
    </AppShell>
  );
}