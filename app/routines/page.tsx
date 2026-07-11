import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { CreateRoutineForm } from "@/components/routines/create-routine-form";
import { ActivateRoutineButton } from "@/components/routines/activate-routine-button";
import { getRoutines } from "@/lib/routines";

export default async function RoutinesPage() {
  const routines = await getRoutines();

  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Rutinas</h1>
        <p className="text-slate-500">
          Organiza tus bloques de entrenamiento
        </p>
      </header>

      <div className="space-y-6">
        <CreateRoutineForm />

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Tus rutinas</h2>

          {routines.length === 0 ? (
            <div className="rounded-2xl border bg-white p-4 text-sm text-slate-500">
              Aún no has creado rutinas.
            </div>
          ) : (
            routines.map((routine) => (
              <div
                key={routine.id}
                className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm"
              >
                <div>
                  <h3 className="font-semibold">{routine.name}</h3>

                  {routine.description ? (
                    <p className="mt-1 text-sm text-slate-500">
                      {routine.description}
                    </p>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <Link
                    href={`/routines/${routine.id}`}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-center text-sm font-medium text-slate-900"
                  >
                    Configurar días
                  </Link>

                  <ActivateRoutineButton routineId={routine.id} />
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </AppShell>
  );
}