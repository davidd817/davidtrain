import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { AddExerciseToDayForm } from "@/components/routines/add-exercise-to-day-form";
import { PlannedExerciseActions } from "@/components/routines/planned-exercise-actions";
import { getExercisesByDay } from "@/lib/day-exercises";
import { getExercises } from "@/lib/exercises";
import { getWorkoutDayById } from "@/lib/workout-days";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    id: string;
    dayId: string;
  }>;
};

export default async function RoutineDayPage({ params }: Props) {
  const { id, dayId } = await params;
  const [day, exercises, dayExercises] = await Promise.all([
    getWorkoutDayById(dayId),
    getExercises(),
    getExercisesByDay(dayId),
  ]);

  if (!day) {
    notFound();
  }

  return (
    <AppShell>
      <header className="mb-5">
        <Link href={`/routines/${id}`} className="mb-3 inline-block text-sm text-slate-500">
          Volver a rutina
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">{day.name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {dayExercises.length} ejercicios planificados
        </p>
      </header>

      <div className="space-y-5">
        <AddExerciseToDayForm
          dayId={dayId}
          exercises={exercises}
          nextOrderIndex={dayExercises.length}
        />

        <section className="space-y-3">
          <h2 className="text-lg font-bold">Ejercicios del dia</h2>

          {dayExercises.length === 0 ? (
            <div className="rounded-2xl border bg-white p-4 text-sm text-slate-500">
              Todavia no has anadido ejercicios a este dia.
            </div>
          ) : (
            dayExercises.map((item, index) => (
              <article key={item.id} className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
                <div>
                  <p className="text-sm text-slate-500">Ejercicio {index + 1}</p>
                  <h3 className="text-lg font-bold">
                    {item.exercises?.name ?? "Ejercicio sin nombre"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.exercises?.primary_muscle || "Sin grupo"}
                    {item.exercises?.secondary_muscle
                      ? ` - ${item.exercises.secondary_muscle}`
                      : ""}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <Info label="Series" value={String(item.sets ?? "-")} />
                  <Info label="Reps" value={`${item.reps_min}-${item.reps_max}`} />
                  <Info label="RIR" value={String(item.rir ?? "-")} />
                  <Info label="Descanso" value={`${item.rest_seconds ?? 0}s`} />
                </div>

                {item.notes ? (
                  <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{item.notes}</p>
                ) : null}

                <PlannedExerciseActions dayId={dayId} item={item} />
              </article>
            ))
          )}
        </section>
      </div>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
}
