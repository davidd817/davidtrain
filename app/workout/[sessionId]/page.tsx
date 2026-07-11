import { AppShell } from "@/components/layout/app-shell";
import { FinishWorkoutButton } from "@/components/workout/finish-workout-button";
import { SetLogRow } from "@/components/workout/set-log-row";
import { getExerciseLogsBySession } from "@/lib/exercise-logs";
import { supabase } from "@/lib/supabase";

type Props = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default async function WorkoutSessionPage({ params }: Props) {
  const { sessionId } = await params;

  const { data: session } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (!session) {
    return (
      <AppShell>
        <div className="rounded-2xl border bg-white p-4 text-sm text-slate-500">
          Sesión no encontrada.
        </div>
      </AppShell>
    );
  }

  const { data: dayExercises } = await supabase
    .from("exercises_in_day")
    .select(
      `
      *,
      exercises (*)
    `
    )
    .eq("day_id", session.day_id)
    .order("order_index", { ascending: true });

  const logs = await getExerciseLogsBySession(sessionId);

  function findLog(exerciseId: string, setNumber: number) {
    return logs.find(
      (log) => log.exercise_id === exerciseId && log.set_number === setNumber
    );
  }

  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Entrenamiento</h1>
        <p className="text-sm text-slate-500">
          Registra tu sesión en tiempo real
        </p>
      </header>

      <div className="space-y-4">
        {session.completed_at ? (
          <div className="rounded-2xl border bg-white p-4 text-sm text-slate-500">
            Esta sesión ya está finalizada.
          </div>
        ) : null}

        {!dayExercises || dayExercises.length === 0 ? (
          <div className="rounded-2xl border bg-white p-4 text-sm text-slate-500">
            Este día no tiene ejercicios configurados.
          </div>
        ) : (
          dayExercises.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border bg-white p-4 shadow-sm"
            >
              <h2 className="text-lg font-semibold">
                {item.exercises?.name}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {item.sets} series · {item.reps_min}-{item.reps_max} reps · RIR{" "}
                {item.rir}
              </p>

              <div className="mt-4 space-y-3">
                {Array.from({ length: item.sets ?? 0 }).map((_, index) => {
                  const setNumber = index + 1;
                  const existingLog = findLog(item.exercise_id, setNumber);

                  return (
                    <SetLogRow
                      key={setNumber}
                      sessionId={sessionId}
                      exerciseId={item.exercise_id}
                      setNumber={setNumber}
                      targetRepsMin={item.reps_min}
                      targetRepsMax={item.reps_max}
                      targetRir={item.rir}
                      initialWeight={existingLog?.weight ?? null}
                      initialReps={existingLog?.reps ?? null}
                      initialRir={existingLog?.rir ?? null}
                    />
                  );
                })}
              </div>
            </div>
          ))
        )}

        {!session.completed_at ? (
          <FinishWorkoutButton sessionId={sessionId} />
        ) : null}
      </div>
    </AppShell>
  );
}