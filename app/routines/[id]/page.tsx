import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { CreateWorkoutDayForm } from "@/components/routines/create-workout-day-form";
import { supabase } from "@/lib/supabase";
import { getDaysByRoutine } from "@/lib/workout-days";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function RoutineDetailPage({ params }: Props) {
  const { id } = await params;

  const { data: routine } = await supabase
    .from("workout_routines")
    .select("*")
    .eq("id", id)
    .single();

  const days = await getDaysByRoutine(id);

  return (
    <AppShell>
      <header className="mb-6">
        <Link
          href="/routines"
          className="mb-3 inline-block text-sm text-slate-500"
        >
          ← Volver a rutinas
        </Link>

        <h1 className="text-2xl font-bold">{routine?.name}</h1>
        <p className="text-sm text-slate-500">
          Configura los días secuenciales de esta rutina
        </p>
      </header>

      <div className="space-y-6">
        <CreateWorkoutDayForm
          routineId={id}
          nextOrderIndex={days.length}
        />

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Días de la rutina</h2>

          {days.length === 0 ? (
            <div className="rounded-2xl border bg-white p-4 text-sm text-slate-500">
              No hay días creados todavía.
            </div>
          ) : (
            days.map((day, index) => (
              <Link
                key={day.id}
                href={`/routines/${id}/days/${day.id}`}
                className="block rounded-2xl border bg-white p-4 shadow-sm"
              >
                <p className="text-sm text-slate-500">Día {index + 1}</p>
                <h3 className="font-semibold">{day.name}</h3>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  Configurar ejercicios →
                </p>
              </Link>
            ))
          )}
        </section>
      </div>
    </AppShell>
  );
}