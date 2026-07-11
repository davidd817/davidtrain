"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArrowDown, ArrowUp, Copy, PenLine } from "lucide-react";

import {
  archiveExerciseInDay,
  duplicateExerciseInDay,
  moveExerciseInDay,
  updateExerciseInDay,
} from "@/lib/day-exercises";
import { getFirstNumberError, parseBoundedNumber } from "@/lib/validation";

export function PlannedExerciseActions({
  dayId,
  item,
}: {
  dayId: string;
  item: {
    id: string;
    sets: number | null;
    reps_min: number | null;
    reps_max: number | null;
    rir: number | null;
    rest_seconds: number | null;
    notes: string | null;
  };
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [sets, setSets] = useState(String(item.sets ?? 3));
  const [repsMin, setRepsMin] = useState(String(item.reps_min ?? 8));
  const [repsMax, setRepsMax] = useState(String(item.reps_max ?? 12));
  const [rir, setRir] = useState(String(item.rir ?? 2));
  const [restSeconds, setRestSeconds] = useState(String(item.rest_seconds ?? 120));
  const [notes, setNotes] = useState(item.notes ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  async function run(action: string, callback: () => Promise<void>) {
    try {
      setBusy(action);
      setError("");
      await callback();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo completar la accion.");
    } finally {
      setBusy("");
    }
  }

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = [
      parseBoundedNumber({ value: sets, label: "Series", min: 1, max: 20, integer: true }),
      parseBoundedNumber({ value: repsMin, label: "Reps min.", min: 1, max: 100, integer: true }),
      parseBoundedNumber({ value: repsMax, label: "Reps max.", min: 1, max: 100, integer: true }),
      parseBoundedNumber({ value: rir, label: "RIR", min: 0, max: 10, integer: true }),
      parseBoundedNumber({ value: restSeconds, label: "Descanso", min: 0, max: 900, integer: true }),
    ];
    const numberError = getFirstNumberError(parsed);

    if (numberError) {
      setError(numberError);
      return;
    }

    if (parsed[1].value > parsed[2].value) {
      setError("Las reps minimas no pueden superar las reps maximas.");
      return;
    }

    await run("edit", async () => {
      await updateExerciseInDay({
        itemId: item.id,
        sets: parsed[0].value,
        repsMin: parsed[1].value,
        repsMax: parsed[2].value,
        rir: parsed[3].value,
        restSeconds: parsed[4].value,
        notes: notes.trim(),
      });
      setIsEditing(false);
    });
  }

  return (
    <div className="space-y-2">
      {isEditing ? (
        <form onSubmit={handleUpdate} className="space-y-2 rounded-xl bg-slate-50 p-3">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Series" value={sets} setValue={setSets} />
            <Field label="RIR" value={rir} setValue={setRir} />
            <Field label="Reps min." value={repsMin} setValue={setRepsMin} />
            <Field label="Reps max." value={repsMax} setValue={setRepsMax} />
            <Field label="Descanso" value={restSeconds} setValue={setRestSeconds} />
          </div>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="min-h-16 w-full rounded-lg border px-3 py-2 text-sm"
          />
          <button className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
            Guardar cambios
          </button>
        </form>
      ) : null}

      {error ? <p className="text-xs text-red-600">{error}</p> : null}

      <div className="grid grid-cols-5 gap-2">
        <Button label="Editar" disabled={Boolean(busy)} onClick={() => setIsEditing(true)}>
          <PenLine className="h-4 w-4" />
        </Button>
        <Button
          label="Subir"
          disabled={Boolean(busy)}
          onClick={() => run("up", async () => moveExerciseInDay({ dayId, itemId: item.id, direction: "up" }))}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        <Button
          label="Bajar"
          disabled={Boolean(busy)}
          onClick={() => run("down", async () => moveExerciseInDay({ dayId, itemId: item.id, direction: "down" }))}
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
        <Button
          label="Duplicar"
          disabled={Boolean(busy)}
          onClick={() => run("copy", async () => void (await duplicateExerciseInDay(item.id)))}
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          label="Archivar"
          disabled={Boolean(busy)}
          onClick={() => {
            if (window.confirm("Quitar este ejercicio del dia? El historial no cambia.")) {
              void run("archive", async () => archiveExerciseInDay(item.id));
            }
          }}
        >
          <Archive className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  setValue,
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
}) {
  return (
    <label className="text-xs font-medium text-slate-500">
      {label}
      <input
        type="number"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="mt-1 w-full rounded-lg border px-2 py-2 text-sm text-slate-900"
      />
    </label>
  );
}

function Button({
  label,
  children,
  disabled,
  onClick,
}: {
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-slate-800 disabled:opacity-50"
    >
      {children}
    </button>
  );
}
