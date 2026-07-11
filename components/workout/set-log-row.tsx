"use client";

import { useState } from "react";

import { saveExerciseSet } from "@/lib/exercise-logs";
import { getFirstNumberError, parseBoundedNumber } from "@/lib/validation";

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
  readOnly = false,
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
  readOnly?: boolean;
}) {
  const [weight, setWeight] = useState(initialWeight != null ? String(initialWeight) : "");
  const [reps, setReps] = useState(initialReps != null ? String(initialReps) : targetRepsMin ? String(targetRepsMin) : "");
  const [rir, setRir] = useState(initialRir != null ? String(initialRir) : targetRir != null ? String(targetRir) : "");
  const [isSaved, setIsSaved] = useState(initialWeight != null && initialReps != null && initialRir != null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    const parsed = [
      parseBoundedNumber({ value: weight, label: "Peso", min: 0, max: 1000 }),
      parseBoundedNumber({ value: reps, label: "Reps", min: 1, max: 100, integer: true }),
      parseBoundedNumber({ value: rir, label: "RIR", min: 0, max: 10, integer: true }),
    ];
    const numberError = getFirstNumberError(parsed);

    if (numberError) {
      setError(numberError);
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      await saveExerciseSet({
        sessionId,
        exerciseId,
        setNumber,
        weight: parsed[0].value,
        reps: parsed[1].value,
        rir: parsed[2].value,
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
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">Serie {setNumber}</p>
        {isSaved ? (
          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
            Guardada
          </span>
        ) : (
          <span className="text-right text-xs text-slate-500">
            Obj. {targetRepsMin}-{targetRepsMax} reps / RIR {targetRir}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <NumberInput
          label="Kg"
          value={weight}
          readOnly={readOnly}
          onChange={(value) => {
            setWeight(value);
            setIsSaved(false);
          }}
        />
        <NumberInput
          label="Reps"
          value={reps}
          readOnly={readOnly}
          onChange={(value) => {
            setReps(value);
            setIsSaved(false);
          }}
        />
        <NumberInput
          label="RIR"
          value={rir}
          readOnly={readOnly}
          onChange={(value) => {
            setRir(value);
            setIsSaved(false);
          }}
        />
      </div>

      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}

      {!readOnly ? (
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="mt-3 w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isSaving ? "Guardando..." : isSaved ? "Actualizar serie" : "Guardar serie"}
        </button>
      ) : null}
    </div>
  );
}

function NumberInput({
  label,
  value,
  readOnly,
  onChange,
}: {
  label: string;
  value: string;
  readOnly: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      <input
        type="number"
        value={value}
        readOnly={readOnly}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border bg-white px-2 py-2 text-sm read-only:bg-slate-100"
      />
    </div>
  );
}
