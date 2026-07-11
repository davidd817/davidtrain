import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Clock3,
  Dumbbell,
  History,
  LineChart,
  Play,
} from "lucide-react";

import { StartWorkoutButton } from "@/components/dashboard/start-workout-button";
import { AppShell } from "@/components/layout/app-shell";
import { formatDateTime, formatDuration, secondsBetween } from "@/lib/format";
import { getExercisesByDay } from "@/lib/day-exercises";
import { getTrainingState } from "@/lib/training-state";
import { getDaysByRoutine } from "@/lib/workout-days";
import {
  getLatestCompletedSession,
  getOpenWorkoutSession,
} from "@/lib/workout-sessions";

export const dynamic = "force-dynamic";

const quickLinks = [
  { href: "/routines", label: "Rutinas", icon: Dumbbell },
  { href: "/training", label: "Biblioteca", icon: BookOpen },
  { href: "/progress", label: "Progreso", icon: LineChart },
  { href: "/progress", label: "Historial", icon: History },
];

export default async function DashboardPage() {
  const [state, openSession, latestCompleted] = await Promise.all([
    getTrainingState(),
    getOpenWorkoutSession(),
    getLatestCompletedSession(),
  ]);

  let todayDay: {
    id: string;
    routine_id: string;
    name: string;
    order_index: number;
  } | null = null;
  let dayCount = 0;
  let exerciseCount = 0;

  if (state?.active_routine_id) {
    const days = await getDaysByRoutine(state.active_routine_id);
    dayCount = days.length;
    todayDay = days[state.next_day_index] ?? days[0] ?? null;

    if (todayDay) {
      const planned = await getExercisesByDay(todayDay.id);
      exerciseCount = planned.length;
    }
  }

  return (
    <AppShell>
      <header className="mb-5">
        <p className="text-sm font-medium text-slate-500">Hoy</p>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </header>

      <div className="space-y-4">
        {openSession ? (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-amber-700">Sesion abierta</p>
                <h2 className="mt-1 text-xl font-bold">
                  {openSession.workout_days?.name ?? "Entrenamiento"}
                </h2>
                <p className="mt-1 text-sm text-amber-800/80">
                  {openSession.workout_routines?.name ?? "Sin rutina"} -{" "}
                  {formatDuration(secondsBetween(openSession.started_at, null))}
                </p>
              </div>
              <Clock3 className="h-6 w-6 text-amber-700" />
            </div>

            <Link
              href={`/workout/${openSession.id}`}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-700 px-4 py-3 text-sm font-semibold text-white"
            >
              Continuar entrenamiento
              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        ) : (
          <section className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">Proximo entrenamiento</p>
                {todayDay && state?.active_routine_id ? (
                  <>
                    <h2 className="mt-1 text-xl font-bold">{todayDay.name}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Dia {todayDay.order_index + 1} de {dayCount} - {exerciseCount} ejercicios
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="mt-1 text-xl font-bold">Sin rutina activa</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Activa una rutina y prepara sus dias para entrenar.
                    </p>
                  </>
                )}
              </div>
              <Play className="h-6 w-6 text-slate-900" />
            </div>

            {todayDay && state?.active_routine_id ? (
              <StartWorkoutButton routineId={state.active_routine_id} dayId={todayDay.id} />
            ) : (
              <Link
                href="/routines"
                className="mt-4 block w-full rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white"
              >
                Ir a rutinas
              </Link>
            )}
          </section>
        )}

        <section className="grid grid-cols-2 gap-3">
          {quickLinks.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-2xl border bg-white p-4 shadow-sm"
              >
                <Icon className="h-5 w-5 text-slate-900" />
                <p className="mt-3 text-sm font-semibold">{item.label}</p>
              </Link>
            );
          })}
        </section>

        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Ultimo completado</p>
          {latestCompleted ? (
            <>
              <h2 className="mt-1 text-lg font-bold">
                {latestCompleted.workout_days?.name ?? "Entrenamiento"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {latestCompleted.workout_routines?.name ?? "Sin rutina"}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Fecha</p>
                  <p className="font-semibold">{formatDateTime(latestCompleted.completed_at)}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Duracion</p>
                  <p className="font-semibold">
                    {formatDuration(
                      latestCompleted.duration_seconds ??
                        secondsBetween(latestCompleted.started_at, latestCompleted.completed_at)
                    )}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <p className="mt-2 text-sm text-slate-500">
              Completa tu primera sesion para ver aqui el resumen.
            </p>
          )}
        </section>
      </div>
    </AppShell>
  );
}
