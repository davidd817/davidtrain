import Link from "next/link";

import { ActivateRoutineButton } from "@/components/routines/activate-routine-button";
import { DeactivateRoutineButton } from "@/components/routines/deactivate-routine-button";
import { AppShell } from "@/components/layout/app-shell";
import { CreateRoutineForm } from "@/components/routines/create-routine-form";
import { RoutineActions } from "@/components/routines/routine-actions";
import { getRoutinesWithStats } from "@/lib/routines";
import { getTrainingState } from "@/lib/training-state";

export const dynamic = "force-dynamic";

export default async function RoutinesPage() {
  const state = await getTrainingState();
  const routines = await getRoutinesWithStats({
    activeRoutineId: state?.active_routine_id,
  });

  return (
    <AppShell>
      <header className="mb-5">
        <p className="text-sm font-medium text-slate-500">Planificacion</p>
        <h1 className="text-3xl font-bold tracking-tight">Rutinas</h1>
      </header>

      <div className="space-y-5">
        <CreateRoutineForm />

        <section className="space-y-3">
          <div className="flex items-end justify-between">
            <h2 className="text-lg font-bold">Tus rutinas</h2>
            <span className="text-sm text-slate-500">{routines.length} activas</span>
          </div>

          {routines.length === 0 ? (
            <div className="rounded-2xl border bg-white p-4 text-sm text-slate-500">
              Crea tu primera rutina para empezar a entrenar.
            </div>
          ) : (
            routines.map((routine) => (
              <article key={routine.id} className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold">{routine.name}</h3>
                      {routine.is_active ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                          Activa
                        </span>
                      ) : null}
                    </div>
                    {routine.description ? (
                      <p className="mt-1 text-sm text-slate-500">{routine.description}</p>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Dias</p>
                    <p className="font-bold">{routine.day_count}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Ejercicios</p>
                    <p className="font-bold">{routine.exercise_count}</p>
                  </div>
                </div>

                <Link
                  href={`/routines/${routine.id}`}
                  className="block w-full rounded-xl border border-slate-300 px-3 py-2 text-center text-sm font-semibold text-slate-900"
                >
                  Configurar rutina
                </Link>

                {routine.is_active ? (
                  <DeactivateRoutineButton />
                ) : (
                  <ActivateRoutineButton routineId={routine.id} />
                )}

                <RoutineActions
                  routineId={routine.id}
                  initialName={routine.name}
                  initialDescription={routine.description}
                />
              </article>
            ))
          )}
        </section>
      </div>
    </AppShell>
  );
}
