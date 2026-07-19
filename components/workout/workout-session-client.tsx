"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { saveExerciseSets } from "@/lib/exercise-logs";
import { formatDateTime } from "@/lib/format";
import { getFirstNumberError, parseBoundedNumber } from "@/lib/validation";
import { completeWorkoutSession } from "@/lib/workout-sessions";

type LogValue = {
  id: string;
  set_number: number;
  weight: number;
  reps: number;
  rir: number;
};

type PreviousPerformance = {
  startedAt: string;
  routineName: string;
  dayName: string;
  sets: LogValue[];
  bestSet: LogValue | null;
};

type WorkoutExercise = {
  key: string;
  exerciseId: string;
  name: string;
  targetSets: number;
  repsMin: number | null;
  repsMax: number | null;
  targetRir: number | null;
  restSeconds: number | null;
  notes: string | null;
  initialLogs: LogValue[];
  previous: PreviousPerformance | null;
};

type DraftSet = {
  setNumber: number;
  weight: string;
  reps: string;
  rir: string;
};

type SaveStatus = "empty" | "saving" | "saved" | "pending" | "error";

type ParsedSet = {
  setNumber: number;
  weight: number;
  reps: number;
  rir: number;
};

type Inspection = {
  validRows: ParsedSet[];
  emptyCount: number;
  incompleteCount: number;
  error: string;
};

const statusCopy: Record<SaveStatus, string> = {
  empty: "Sin guardar",
  saving: "Guardando",
  saved: "Guardado",
  pending: "Cambios pendientes",
  error: "Error",
};

const statusClass: Record<SaveStatus, string> = {
  empty: "bg-slate-100 text-slate-600",
  saving: "bg-sky-100 text-sky-700",
  saved: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  error: "bg-red-100 text-red-700",
};

export function WorkoutSessionClient({
  sessionId,
  readOnly,
  exercises,
}: {
  sessionId: string;
  readOnly: boolean;
  exercises: WorkoutExercise[];
}) {
  const router = useRouter();
  const initialDrafts = useMemo(() => buildInitialDrafts(exercises), [exercises]);
  const [draftsByKey, setDraftsByKey] = useState<Record<string, DraftSet[]>>(initialDrafts);
  const [savedSignatures, setSavedSignatures] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(initialDrafts).map(([key, value]) => [key, signature(value)]))
  );
  const [statusByKey, setStatusByKey] = useState<Record<string, SaveStatus>>(() =>
    Object.fromEntries(
      exercises.map((exercise) => [
        exercise.key,
        exercise.initialLogs.length > 0 ? "saved" : "empty",
      ])
    )
  );
  const [savedCountByKey, setSavedCountByKey] = useState<Record<string, number>>(() =>
    Object.fromEntries(exercises.map((exercise) => [exercise.key, exercise.initialLogs.length]))
  );
  const [errorsByKey, setErrorsByKey] = useState<Record<string, string>>({});
  const [isFinishing, setIsFinishing] = useState(false);
  const [confirmOmit, setConfirmOmit] = useState(false);
  const [finishError, setFinishError] = useState("");
  const [finishWarning, setFinishWarning] = useState("");

  const savedSets = Object.values(savedCountByKey).reduce((sum, count) => sum + count, 0);
  const totalSets = exercises.reduce((sum, exercise) => sum + exercise.targetSets, 0);

  function updateDraft(key: string, setNumber: number, field: keyof Omit<DraftSet, "setNumber">, value: string) {
    if (readOnly) {
      return;
    }

    setDraftsByKey((current) => {
      const nextDrafts = (current[key] ?? []).map((draft) =>
        draft.setNumber === setNumber ? { ...draft, [field]: value } : draft
      );
      const nextSignature = signature(nextDrafts);
      setStatusByKey((statuses) => ({
        ...statuses,
        [key]: nextSignature === savedSignatures[key] ? statusFromDrafts(nextDrafts) : "pending",
      }));
      setErrorsByKey((errors) => ({ ...errors, [key]: "" }));
      setConfirmOmit(false);
      setFinishWarning("");
      return { ...current, [key]: nextDrafts };
    });
  }

  async function saveExercise(key: string, options: { allowIncomplete: boolean }) {
    const exercise = exercises.find((item) => item.key === key);
    const drafts = draftsByKey[key] ?? [];

    if (!exercise) {
      throw new Error("Ejercicio no encontrado.");
    }

    const inspection = inspectDrafts(drafts, options.allowIncomplete);

    if (inspection.error) {
      setStatusByKey((statuses) => ({ ...statuses, [key]: "error" }));
      setErrorsByKey((errors) => ({ ...errors, [key]: inspection.error }));
      throw new Error(inspection.error);
    }

    if (inspection.validRows.length === 0) {
      if (!options.allowIncomplete) {
        const message = "Completa al menos una serie antes de guardar este ejercicio.";
        setStatusByKey((statuses) => ({ ...statuses, [key]: "error" }));
        setErrorsByKey((errors) => ({ ...errors, [key]: message }));
        throw new Error(message);
      }

      return inspection;
    }

    try {
      setStatusByKey((statuses) => ({ ...statuses, [key]: "saving" }));
      setErrorsByKey((errors) => ({ ...errors, [key]: "" }));
      await saveExerciseSets({
        sessionId,
        exerciseId: exercise.exerciseId,
        sets: inspection.validRows,
      });
      const nextSignature = signature(drafts);
      setSavedSignatures((current) => ({ ...current, [key]: nextSignature }));
      setSavedCountByKey((counts) => ({ ...counts, [key]: inspection.validRows.length }));
      setStatusByKey((statuses) => ({ ...statuses, [key]: statusFromDrafts(drafts) }));
      return inspection;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error guardando ejercicio.";
      setStatusByKey((statuses) => ({ ...statuses, [key]: "error" }));
      setErrorsByKey((errors) => ({ ...errors, [key]: message }));
      throw new Error(message);
    }
  }

  async function handleFinish() {
    if (readOnly || isFinishing) {
      return;
    }

    try {
      setIsFinishing(true);
      setFinishError("");
      setFinishWarning("");

      let emptyCount = 0;
      let incompleteCount = 0;

      for (const exercise of exercises) {
        const drafts = draftsByKey[exercise.key] ?? [];
        const inspection = inspectDrafts(drafts, true);
        emptyCount += inspection.emptyCount;
        incompleteCount += inspection.incompleteCount;

        if (inspection.error) {
          throw new Error(`${exercise.name}: ${inspection.error}`);
        }

        if (statusByKey[exercise.key] === "pending" || statusByKey[exercise.key] === "error") {
          await saveExercise(exercise.key, { allowIncomplete: true });
        }
      }

      if ((emptyCount > 0 || incompleteCount > 0) && !confirmOmit) {
        setConfirmOmit(true);
        setFinishWarning(
          `Hay ${emptyCount} series vacias y ${incompleteCount} incompletas. Puedes finalizar omitiendolas.`
        );
        return;
      }

      await completeWorkoutSession({
        sessionId,
        allowIncomplete: emptyCount > 0 || incompleteCount > 0 || confirmOmit,
      });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setFinishError(err instanceof Error ? err.message : "Error finalizando entrenamiento.");
    } finally {
      setIsFinishing(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 text-sm">
        <Stat label="Series" value={`${savedSets}/${totalSets}`} />
        <Stat label="Estado" value={readOnly ? "Cerrada" : "Activa"} />
      </div>

      {readOnly ? (
        <div className="rounded-2xl border bg-white p-4 text-sm text-slate-600 shadow-sm">
          Esta sesion esta finalizada. Puedes revisar los datos, pero no editarla.
        </div>
      ) : null}

      {exercises.length === 0 ? (
        <div className="rounded-2xl border bg-white p-4 text-sm text-slate-500">
          Este dia no tiene ejercicios configurados.
        </div>
      ) : (
        exercises.map((exercise) => {
          const drafts = draftsByKey[exercise.key] ?? [];
          const status = statusByKey[exercise.key] ?? "empty";
          const currentBest = bestCurrentSet(drafts);

          return (
            <section key={exercise.key} className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">{exercise.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {exercise.targetSets} series - {exercise.repsMin}-{exercise.repsMax} reps - RIR {exercise.targetRir}
                  </p>
                  {exercise.restSeconds ? (
                    <p className="mt-1 text-xs text-slate-500">Descanso objetivo: {exercise.restSeconds}s</p>
                  ) : null}
                </div>
                <Link
                  href={`/progress/${exercise.exerciseId}`}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold"
                >
                  Progreso
                </Link>
              </div>

              {exercise.notes ? (
                <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{exercise.notes}</p>
              ) : null}

              <PreviousBlock previous={exercise.previous} currentBest={currentBest} />

              <div className="mt-4 overflow-hidden rounded-xl border">
                <div className="grid grid-cols-[48px_1fr_1fr_1fr] bg-slate-100 px-2 py-2 text-xs font-semibold text-slate-500">
                  <span>Serie</span>
                  <span>Kg</span>
                  <span>Reps</span>
                  <span>RIR</span>
                </div>
                <div className="divide-y">
                  {drafts.map((draft) => (
                    <div key={draft.setNumber} className="grid grid-cols-[48px_1fr_1fr_1fr] items-center gap-2 px-2 py-2">
                      <span className="text-sm font-semibold text-slate-600">S{draft.setNumber}</span>
                      <CompactInput
                        value={draft.weight}
                        readOnly={readOnly}
                        step="0.5"
                        onChange={(value) => updateDraft(exercise.key, draft.setNumber, "weight", value)}
                      />
                      <CompactInput
                        value={draft.reps}
                        readOnly={readOnly}
                        step="1"
                        onChange={(value) => updateDraft(exercise.key, draft.setNumber, "reps", value)}
                      />
                      <CompactInput
                        value={draft.rir}
                        readOnly={readOnly}
                        step="1"
                        onChange={(value) => updateDraft(exercise.key, draft.setNumber, "rir", value)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className={`w-fit rounded-full px-2 py-1 text-xs font-semibold ${statusClass[status]}`}>
                  {statusCopy[status]}
                </span>
                {!readOnly ? (
                  <button
                    type="button"
                    onClick={() => void saveExercise(exercise.key, { allowIncomplete: false })}
                    disabled={status === "saving"}
                    className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Guardar ejercicio
                  </button>
                ) : null}
              </div>

              {errorsByKey[exercise.key] ? (
                <p className="mt-2 text-sm text-red-600">{errorsByKey[exercise.key]}</p>
              ) : null}
            </section>
          );
        })
      )}

      {!readOnly ? (
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          {finishWarning ? (
            <p className="mb-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{finishWarning}</p>
          ) : null}
          {finishError ? <p className="mb-3 text-sm text-red-600">{finishError}</p> : null}
          <button
            type="button"
            onClick={handleFinish}
            disabled={isFinishing}
            className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isFinishing
              ? "Finalizando..."
              : confirmOmit
                ? "Finalizar omitiendo series"
                : "Finalizar entrenamiento"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function buildInitialDrafts(exercises: WorkoutExercise[]) {
  return Object.fromEntries(
    exercises.map((exercise) => [
      exercise.key,
      Array.from({ length: exercise.targetSets }).map((_, index) => {
        const setNumber = index + 1;
        const existing = exercise.initialLogs.find((log) => log.set_number === setNumber);

        return {
          setNumber,
          weight: existing?.weight != null ? String(existing.weight) : "",
          reps: existing?.reps != null ? String(existing.reps) : exercise.repsMin ? String(exercise.repsMin) : "",
          rir: existing?.rir != null ? String(existing.rir) : exercise.targetRir != null ? String(exercise.targetRir) : "",
        };
      }),
    ])
  );
}

function statusFromDrafts(drafts: DraftSet[]): SaveStatus {
  return inspectDrafts(drafts, true).validRows.length > 0 ? "saved" : "empty";
}

function signature(drafts: DraftSet[]) {
  return JSON.stringify(drafts.map((draft) => ({
    setNumber: draft.setNumber,
    weight: draft.weight.trim(),
    reps: draft.reps.trim(),
    rir: draft.rir.trim(),
  })));
}

function inspectDrafts(drafts: DraftSet[], allowIncomplete: boolean): Inspection {
  const validRows: ParsedSet[] = [];
  let emptyCount = 0;
  let incompleteCount = 0;

  for (const draft of drafts) {
    const values = [draft.weight.trim(), draft.reps.trim(), draft.rir.trim()];
    const isEmpty = values.every((value) => value === "");
    const isComplete = values.every((value) => value !== "");

    if (isEmpty) {
      emptyCount += 1;
      continue;
    }

    if (!isComplete) {
      incompleteCount += 1;
      if (!allowIncomplete) {
        return {
          validRows,
          emptyCount,
          incompleteCount,
          error: `Serie ${draft.setNumber}: completa kg, reps y RIR.`,
        };
      }
      continue;
    }

    const parsed = [
      parseBoundedNumber({ value: draft.weight, label: `Serie ${draft.setNumber} peso`, min: 0, max: 1000 }),
      parseBoundedNumber({ value: draft.reps, label: `Serie ${draft.setNumber} reps`, min: 1, max: 100, integer: true }),
      parseBoundedNumber({ value: draft.rir, label: `Serie ${draft.setNumber} RIR`, min: 0, max: 10, integer: true }),
    ];
    const numberError = getFirstNumberError(parsed);

    if (numberError) {
      return { validRows, emptyCount, incompleteCount, error: numberError };
    }

    validRows.push({
      setNumber: draft.setNumber,
      weight: parsed[0].value,
      reps: parsed[1].value,
      rir: parsed[2].value,
    });
  }

  return { validRows, emptyCount, incompleteCount, error: "" };
}

function bestCurrentSet(drafts: DraftSet[]) {
  return inspectDrafts(drafts, true).validRows.reduce<ParsedSet | null>((best, set) => {
    if (!best || set.weight > best.weight || (set.weight === best.weight && set.reps > best.reps)) {
      return set;
    }

    return best;
  }, null);
}

function PreviousBlock({
  previous,
  currentBest,
}: {
  previous: PreviousPerformance | null;
  currentBest: ParsedSet | null;
}) {
  return (
    <div className="mt-3 rounded-xl border bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase text-slate-500">Ultima vez en este dia</p>
      {previous ? (
        <>
          <p className="mt-1 text-sm font-semibold">
            {formatDateTime(previous.startedAt)} - {previous.dayName}
          </p>
          <div className="mt-2 space-y-1 text-xs text-slate-600">
            {previous.sets.map((set) => (
              <p key={set.id}>
                S{set.set_number}: {set.weight} kg x {set.reps} reps / RIR {set.rir}
              </p>
            ))}
          </div>
          {previous.bestSet ? (
            <p className="mt-2 text-xs font-semibold text-slate-900">
              Mejor anterior: {previous.bestSet.weight} kg x {previous.bestSet.reps}
              {currentBest && currentBest.weight >= previous.bestSet.weight
                ? " - hoy igualas o mejoras carga"
                : ""}
            </p>
          ) : null}
        </>
      ) : (
        <p className="mt-1 text-sm text-slate-500">Sin registros anteriores para este dia.</p>
      )}
    </div>
  );
}

function CompactInput({
  value,
  readOnly,
  step,
  onChange,
}: {
  value: string;
  readOnly: boolean;
  step: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      step={step}
      value={value}
      readOnly={readOnly}
      onChange={(event) => onChange(event.target.value)}
      className="min-w-0 rounded-lg border bg-white px-2 py-2 text-sm read-only:bg-slate-100"
    />
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
