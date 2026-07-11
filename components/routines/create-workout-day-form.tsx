"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createWorkoutDay } from "@/lib/workout-days";

export function CreateWorkoutDayForm({
  routineId,
  nextOrderIndex,
}: {
  routineId: string;
  nextOrderIndex: number;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();

    if (cleanName.length < 2) {
      setError("El nombre del dia debe tener al menos 2 caracteres.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      await createWorkoutDay({
        routineId,
        name: cleanName,
        orderIndex: nextOrderIndex,
      });
      setName("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creando el dia.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
      <div>
        <label className="mb-1 block text-sm font-medium">Nuevo dia de rutina</label>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ej: Dia 1 - Upper"
          className="w-full rounded-xl border px-3 py-2"
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {isSubmitting ? "Creando..." : "Anadir dia"}
      </button>
    </form>
  );
}
