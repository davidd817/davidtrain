import Link from "next/link";
import { notFound } from "next/navigation";

import { ActivateRoutineButton } from "@/components/routines/activate-routine-button";
import { AppShell } from "@/components/layout/app-shell";
import { CreateWorkoutDayForm } from "@/components/routines/create-workout-day-form";
import { DayActions } from "@/components/routines/day-actions";
import { getExercisesByDay } from "@/lib/day-exercises";
import { getRoutineById } from "@/lib/routines";
import { getTrainingState } from "@/lib/training-state";
import { getDaysByRoutine } from "@/lib/workout-days";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function RoutineDetailPage({ params }: Props) {
  const { id } = await params;
  const [routine, days, state] = await Promise.all([
    getRoutineById(id),
    getDaysByRoutine(id),
    getTrainingState(),
  ]);

  if (!routine) {
    notFound();
  }

  const counts = await Promise.all(days.map((day) => getExercisesByDay(day.id)));
  const isActive = state?.active_routine_id === id;

  return (
    <AppShell>
      <header className="mb-5">
        <Link href="/routines" className="mb-3 inline-block text-sm text-slate-500">
          Volver a rutinas
        </Link>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">{routine.name}</h1>
          {isActive ? (
            <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
              Activa
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Configura dias secuenciales y elige por donde empezar.
        </p>
      </header>

      <div className="space-y-5">
        <CreateWorkoutDayForm routineId={id} nextOrderIndex={days.length} />

        <section className="space-y-3">
          <h2 className="text-lg font-bold">Dias de la rutina</h2>

          {days.length === 0 ? (
            <div className="rounded-2xl border bg-white p-4 text-sm text-slate-500">
              No hay dias creados todavia.
            </div>
          ) : (
            days.map((day, index) => (
              <article key={day.id} className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
                <Link href={`/routines/${id}/days/${day.id}`} className="block">
                  <p className="text-sm text-slate-500">Dia {index + 1}</p>
                  <h3 className="text-lg font-bold">{day.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {counts[index]?.length ?? 0} ejercicios
                  </p>
                </Link>

                <div className="grid grid-cols-1 gap-2">
                  <ActivateRoutineButton
                    routineId={id}
                    nextDayIndex={index}
                    label={`Activar desde dia ${index + 1}`}
                  />
                  <DayActions routineId={id} dayId={day.id} initialName={day.name} />
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </AppShell>
  );
}
