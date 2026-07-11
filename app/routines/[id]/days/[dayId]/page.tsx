import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { AddExerciseToDayForm } from "@/components/routines/add-exercise-to-day-form";
import { getExercisesByDay } from "@/lib/day-exercises";
import { getExercises } from "@/lib/exercises";
import { supabase } from "@/lib/supabase";

type Props = {
  params: Promise<{
    id: string;
    dayId: string;
  }>;
};

export default async function RoutineDayPage({ params }: Props) {
  const { id, dayId } = await params;

  const { data: day } = await supabase
    .from("workout_days")
    .select("*")
    .eq("id", dayId)
    .single();

  const exercises = await getExercises();
  const dayExercises = await getExercisesByDay(dayId);

  return (
    <AppShell>
      <header className="mb-6">
        <Link
          href={`/routines/${id}`}
          className="mb-3 inline-block text-sm text-slate-500"
        >
          ← Volver a rutina
        </Link>

        <h1 className="text-2xl font-bold">{day?.name}</h1>
        <p className="text-sm text-slate-500">
          Configura los ejercicios de este día
        </p>
      </header>

      <div className="space-y-6">
        <AddExerciseToDayForm
          dayId={dayId}
          exercises={exercises}
          nextOrderIndex={dayExercises.length}
        />

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Ejercicios del día</h2>

          {dayExercises.length === 0 ? (
            <div className="rounded-2xl border bg-white p-4 text-sm text-slate-500">
              Aún no has añadido ejercicios a este día.
            </div>
          ) : (
            dayExercises.map((item, index) => (
              <article
                key={item.id}
                className="rounded-2xl border bg-white p-4 shadow-sm"
              >
                <p className="text-sm text-slate-500">
                  Ejercicio {index + 1}
                </p>

                <h3 className="font-semibold">
                  {item.exercises?.name || "Ejercicio sin nombre"}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {item.exercises?.primary_muscle || "Sin grupo"}
                  {item.exercises?.secondary_muscle
                    ? ` · ${item.exercises.secondary_muscle}`
                    : ""}
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-xl bg-slate-50 p-2">
                    Series: {item.sets}
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2">
                    Reps: {item.reps_min}-{item.reps_max}
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2">
                    RIR: {item.rir}
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2">
                    Descanso: {item.rest_seconds}s
                  </div>
                </div>

                {item.notes ? (
                  <p className="mt-3 text-sm text-slate-600">{item.notes}</p>
                ) : null}
              </article>
            ))
          )}
        </section>
      </div>
    </AppShell>
  );
}