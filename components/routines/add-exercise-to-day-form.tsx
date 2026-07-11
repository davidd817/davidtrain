"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { addExerciseToDay } from "@/lib/day-exercises";
import type { Exercise } from "@/lib/types";
import { getFirstNumberError, parseBoundedNumber } from "@/lib/validation";

export function AddExerciseToDayForm({
  dayId,
  exercises,
  nextOrderIndex,
}: {
  dayId: string;
  exercises: Exercise[];
  nextOrderIndex: number;
}) {
  const router = useRouter();

  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("");
  const [sets, setSets] = useState("3");
  const [repsMin, setRepsMin] = useState("8");
  const [repsMax, setRepsMax] = useState("12");
  const [rir, setRir] = useState("2");
  const [restSeconds, setRestSeconds] = useState("120");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const muscleGroups = useMemo(() => {
    return Array.from(
      new Set(exercises.map((exercise) => exercise.primary_muscle).filter(Boolean))
    ).sort() as string[];
  }, [exercises]);

  const filteredExercises = useMemo(() => {
    return exercises
      .filter((exercise) => {
        const matchesSearch = exercise.name.toLowerCase().includes(search.toLowerCase());
        const matchesMuscle = muscleFilter ? exercise.primary_muscle === muscleFilter : true;

        return matchesSearch && matchesMuscle;
      })
      .slice(0, 40);
  }, [exercises, search, muscleFilter]);

  const selectedExercise = exercises.find((exercise) => exercise.id === selectedExerciseId);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedExerciseId) {
      setError("Selecciona un ejercicio.");
      return;
    }

    const parsed = [
      parseBoundedNumber({ value: sets, label: "Series", min: 1, max: 20, integer: true }),
      parseBoundedNumber({ value: repsMin, label: "Reps min.", min: 1, max: 100, integer: true }),
      parseBoundedNumber({ value: repsMax, label: "Reps max.", min: 1, max: 100, integer: true }),
      parseBoundedNumber({ value: rir, label: "RIR", min: 0, max: 10, integer: true }),
      parseBoundedNumber({
        value: restSeconds,
        label: "Descanso",
        min: 0,
        max: 900,
        integer: true,
      }),
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

    try {
      setIsSubmitting(true);
      setError("");

      await addExerciseToDay({
        dayId,
        exerciseId: selectedExerciseId,
        sets: parsed[0].value,
        repsMin: parsed[1].value,
        repsMax: parsed[2].value,
        rir: parsed[3].value,
        restSeconds: parsed[4].value,
        notes: notes.trim(),
        orderIndex: nextOrderIndex,
      });

      setSelectedExerciseId("");
      setSearch("");
      setMuscleFilter("");
      setSets("3");
      setRepsMin("8");
      setRepsMax("12");
      setRir("2");
      setRestSeconds("120");
      setNotes("");

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error anadiendo ejercicio.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border bg-white p-4 shadow-sm">
      <div>
        <label className="mb-1 block text-sm font-medium">Buscar ejercicio</label>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Ej: press banca, remo, curl..."
          className="w-full rounded-xl border px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Filtrar por grupo</label>
        <select
          value={muscleFilter}
          onChange={(event) => setMuscleFilter(event.target.value)}
          className="w-full rounded-xl border px-3 py-2"
        >
          <option value="">Todos los grupos</option>
          {muscleGroups.map((muscle) => (
            <option key={muscle} value={muscle}>
              {muscle}
            </option>
          ))}
        </select>
      </div>

      <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border bg-slate-50 p-2">
        {filteredExercises.length === 0 ? (
          <p className="p-2 text-sm text-slate-500">No se encontraron ejercicios.</p>
        ) : (
          filteredExercises.map((exercise) => {
            const isSelected = selectedExerciseId === exercise.id;

            return (
              <button
                key={exercise.id}
                type="button"
                onClick={() => setSelectedExerciseId(exercise.id)}
                className={`w-full rounded-xl border p-3 text-left text-sm ${
                  isSelected
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-900"
                }`}
              >
                <div className="font-medium">{exercise.name}</div>
                <div className={`mt-1 text-xs ${isSelected ? "text-slate-200" : "text-slate-500"}`}>
                  {exercise.primary_muscle || "Sin grupo"}
                  {exercise.secondary_muscle ? ` - ${exercise.secondary_muscle}` : ""}
                </div>
              </button>
            );
          })
        )}
      </div>

      {selectedExercise ? (
        <div className="rounded-xl bg-slate-100 p-3 text-sm">
          <p className="text-slate-500">Ejercicio seleccionado</p>
          <p className="font-semibold">{selectedExercise.name}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <NumberField label="Series" value={sets} onChange={setSets} />
        <NumberField label="RIR" value={rir} onChange={setRir} />
        <NumberField label="Reps min." value={repsMin} onChange={setRepsMin} />
        <NumberField label="Reps max." value={repsMax} onChange={setRepsMax} />
      </div>

      <NumberField label="Descanso en segundos" value={restSeconds} onChange={setRestSeconds} />

      <div>
        <label className="mb-1 block text-sm font-medium">Notas</label>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Ej: controlar excentrica, no llegar al fallo..."
          className="min-h-20 w-full rounded-xl border px-3 py-2"
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {isSubmitting ? "Anadiendo..." : "Anadir ejercicio al dia"}
      </button>
    </form>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border px-3 py-2"
      />
    </div>
  );
}
