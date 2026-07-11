"use client";

import { useState } from "react";

import { saveExerciseSet } from "@/lib/exercise-logs";

export function SetLogRow({
  sessionId,
  exerciseId,
  setNumber,
  targetRepsMin,
  targetRepsMax,
  targetRir,
  initialWeight,
  initialReps,
  initialRir,
}: {
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  targetRepsMin: number | null;
  targetRepsMax: number | null;
  targetRir: number | null;
  initialWeight?: number | null;
  initialReps?: number | null;
  initialRir?: number | null;
}) {
  const [weight, setWeight] = useState(
    initialWeight !== undefined && initialWeight !== null
      ? String(initialWeight)
      : ""
  );

  const [reps, setReps] = useState(
    initialReps !== undefined && initialReps !== null
      ? String(initialReps)
      : targetRepsMin
        ? String(targetRepsMin)
        : ""
  );

  const [rir, setRir] = useState(
    initialRir !== undefined && initialRir !== null
      ? String(initialRir)
      : targetRir
        ? String(targetRir)
        : ""
  );

  const [isSaved, setIsSaved] = useState(
    initialWeight !== undefined && initialWeight !== null
  );

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!weight || !reps || !rir) {
      setError("Completa peso, reps y RIR.");
      return;
    }

    try {
      setIsSaving(true);
      setError("");

      await saveExerciseSet({
        sessionId,
        exerciseId,
        setNumber,
        weight: Number(weight),
        reps: Number(reps),
        rir: Number(rir),
      });

      setIsSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error guardando serie.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-xl border bg-slate-50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium">Serie {setNumber}</p>

        {isSaved ? (
          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
            Guardada
          </span>
        ) : (
          <span className="text-xs text-slate-500">
            Objetivo {targetRepsMin}-{targetRepsMax} reps · RIR {targetRir}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="mb-1 block text-xs text-slate-500">Kg</label>
          <input
            type="number"
            value={weight}
            onChange={(event) => {
              setWeight(event.target.value);
              setIsSaved(false);
            }}
            className="w-full rounded-lg border bg-white px-2 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-slate-500">Reps</label>
          <input
            type="number"
            value={reps}
            onChange={(event) => {
              setReps(event.target.value);
              setIsSaved(false);
            }}
            className="w-full rounded-lg border bg-white px-2 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-slate-500">RIR</label>
          <input
            type="number"
            value={rir}
            onChange={(event) => {
              setRir(event.target.value);
              setIsSaved(false);
            }}
            className="w-full rounded-lg border bg-white px-2 py-2 text-sm"
          />
        </div>
      </div>

      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="mt-3 w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isSaving ? "Guardando..." : isSaved ? "Actualizar serie" : "Guardar serie"}
      </button>
    </div>
  );
}