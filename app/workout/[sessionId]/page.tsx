import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { FinishWorkoutButton } from "@/components/workout/finish-workout-button";
import { SetLogRow } from "@/components/workout/set-log-row";
import { formatDateTime, formatDuration, secondsBetween } from "@/lib/format";
import { getExerciseLogsBySession } from "@/lib/exercise-logs";
import {
  getPlannedExercisesForSession,
  getPreviousExercisePerformances,
  getWorkoutSessionById,
} from "@/lib/workout-sessions";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default async function WorkoutSessionPage({ params }: Props) {
  const { sessionId } = await params;
  const session = await getWorkoutSessionById(sessionId);

  if (!session) {
    notFound();
  }

  const [dayExercises, logs] = await Promise.all([
    getPlannedExercisesForSession(session),
    getExerciseLogsBySession(sessionId),
  ]);

  const previous = await getPreviousExercisePerformances({
    exerciseIds: dayExercises.map((item) => item.exercise_id),
    currentSessionId: sessionId,
    beforeStartedAt: session.started_at,
  });

  const totalSets = dayExercises.reduce((sum, item) => sum + (item.sets ?? 0), 0);
  const savedSets = logs.length;
  const missingSets = Math.max(0, totalSets - savedSets);
  const readOnly = Boolean(session.completed_at);

  function findLog(exerciseId: string, setNumber: number) {
    return logs.find((log) => log.exercise_id === exerciseId && log.set_number === setNumber);
  }

  return (
    <AppShell>
      <header className="mb-5">
        <Link href="/dashboard" className="mb-3 inline-block text-sm text-slate-500">
          Volver
        </Link>
        <p className="text-sm font-medium text-slate-500">
          {session.workout_routines?.name ?? "Sin rutina"}
        </p>
        <h1 className="text-3xl font-bold tracking-tight">
          {session.workout_days?.name ?? "Entrenamiento"}
        </h1>
        <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
          <Stat label="Duracion" value={formatDuration(secondsBetween(session.started_at, session.completed_at))} />
          <Stat label="Series" value={`${savedSets}/${totalSets}`} />
          <Stat label="Estado" value={readOnly ? "Cerrada" : "Activa"} />
        </div>
      </header>

      <div className="space-y-4">
        {readOnly ? (
          <div className="rounded-2xl border bg-white p-4 text-sm text-slate-600 shadow-sm">
            Esta sesion esta finalizada. Puedes revisar los datos, pero no editarla.
          </div>
        ) : null}

        {dayExercises.length === 0 ? (
          <div className="rounded-2xl border bg-white p-4 text-sm text-slate-500">
            Este dia no tiene ejercicios configurados.
          </div>
        ) : (
          dayExercises.map((item) => {
            const previousItem = previous.get(item.exercise_id);
            const currentLogs = logs.filter((log) => log.exercise_id === item.exercise_id);
            const bestCurrent = currentLogs.reduce<(typeof logs)[number] | null>((best, log) => {
              if (!best || log.weight > best.weight || (log.weight === best.weight && log.reps > best.reps)) {
                return log;
              }

              return best;
            }, null);

            return (
              <section key={item.id} className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold">{item.exercises?.name ?? "Ejercicio"}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.sets} series - {item.reps_min}-{item.reps_max} reps - RIR {item.rir}
                    </p>
                    {item.rest_seconds ? (
                      <p className="mt-1 text-xs text-slate-500">Descanso objetivo: {item.rest_seconds}s</p>
                    ) : null}
                  </div>
                  <Link
                    href={`/progress/${item.exercise_id}`}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold"
                  >
                    Progreso
                  </Link>
                </div>

                {item.notes ? (
                  <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{item.notes}</p>
                ) : null}

                <div className="mt-3 rounded-xl border bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase text-slate-500">Ultima vez</p>
                  {previousItem ? (
                    <>
                      <p className="mt-1 text-sm font-semibold">
                        {formatDateTime(previousItem.startedAt)} - {previousItem.dayName}
                      </p>
                      <div className="mt-2 space-y-1 text-xs text-slate-600">
                        {previousItem.sets.map((set) => (
                          <p key={set.id}>
                            S{set.set_number}: {set.weight} kg x {set.reps} reps / RIR {set.rir}
                          </p>
                        ))}
                      </div>
                      {previousItem.bestSet ? (
                        <p className="mt-2 text-xs font-semibold text-slate-900">
                          Mejor anterior: {previousItem.bestSet.weight} kg x {previousItem.bestSet.reps}
                          {bestCurrent && bestCurrent.weight >= previousItem.bestSet.weight
                            ? " - hoy igualas o mejoras carga"
                            : ""}
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-slate-500">Sin registros anteriores.</p>
                  )}
                </div>

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
                        readOnly={readOnly}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })
        )}

        {!readOnly ? <FinishWorkoutButton sessionId={sessionId} missingSets={missingSets} /> : null}
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  );
}
