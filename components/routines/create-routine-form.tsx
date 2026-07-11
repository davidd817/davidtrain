"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createRoutine } from "@/lib/routines";

export function CreateRoutineForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!name.trim()) {
      setError("El nombre de la rutina es obligatorio.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      await createRoutine(name.trim(), description.trim());

      setName("");
      setDescription("");

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error creando rutina."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border bg-white p-4 shadow-sm"
    >
      <div>
        <label className="mb-1 block text-sm font-medium">
          Nombre rutina
        </label>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Upper Lower"
          className="w-full rounded-xl border px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Descripción
        </label>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ej: Rutina 4 días enfocada en hipertrofia"
          className="w-full rounded-xl border px-3 py-2"
        />
      </div>

      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
      >
        {isSubmitting ? "Creando..." : "Crear rutina"}
      </button>
    </form>
  );
}