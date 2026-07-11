import { AppShell } from "@/components/layout/app-shell";
import { StartWorkoutButton } from "@/components/dashboard/start-workout-button";
import { getTrainingState } from "@/lib/training-state";
import { getDaysByRoutine } from "@/lib/workout-days";

export default async function DashboardPage() {
  const state = await getTrainingState();

  let todayDay: {
    id: string;
    routine_id: string;
    name: string;
    order_index: number;
  } | null = null;

  if (state?.active_routine_id) {
    const days = await getDaysByRoutine(state.active_routine_id);
    todayDay = days[state.next_day_index] ?? null;
  }

  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-slate-500">Resumen de tu día</p>
      </header>

      <div className="space-y-4">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Entrenamiento de hoy</p>

          {todayDay && state?.active_routine_id ? (
            <>
              <h2 className="mt-1 text-lg font-semibold">{todayDay.name}</h2>
              <p className="mt-1 text-sm text-slate-500">
                Día actual de tu rutina activa
              </p>

              <StartWorkoutButton
                routineId={state.active_routine_id}
                dayId={todayDay.id}
              />
            </>
          ) : (
            <>
              <h2 className="mt-1 text-lg font-semibold">Sin día asignado</h2>
              <p className="mt-1 text-sm text-slate-500">
                Activa una rutina y añade días dentro de ella
              </p>
            </>
          )}
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Nutrición</p>
          <h2 className="text-lg font-semibold">Pendiente</h2>
          <p className="text-sm text-slate-500">Lo construiremos más adelante</p>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Peso corporal</p>
          <h2 className="text-lg font-semibold">Sin registro</h2>
          <p className="text-sm text-slate-500">Añadiremos check-ins después</p>
        </div>
      </div>
    </AppShell>
  );
}