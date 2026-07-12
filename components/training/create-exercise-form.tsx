"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { createExercise } from "@/lib/exercises";
import { MUSCLE_GROUPS } from "@/lib/muscles";

export function CreateExerciseForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [primaryMuscle, setPrimaryMuscle] = useState("");
  const [secondaryMuscle, setSecondaryMuscle] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    const cleanName = name.trim();

    if (cleanName.length < 2) {
      setErrorMessage("El nombre debe tener al menos 2 caracteres.");
      return;
    }

    if (youtubeUrl.trim() && !youtubeUrl.trim().startsWith("http")) {
      setErrorMessage("El enlace de video debe empezar por http.");
      return;
    }

    try {
      setIsSubmitting(true);
      await createExercise({
        name: cleanName,
        primary_muscle: primaryMuscle.trim(),
        secondary_muscle: secondaryMuscle.trim(),
        description: description.trim(),
        notes: notes.trim(),
        youtube_url: youtubeUrl.trim(),
        is_favorite: isFavorite,
      });

      setName("");
      setPrimaryMuscle("");
      setSecondaryMuscle("");
      setDescription("");
      setNotes("");
      setYoutubeUrl("");
      setIsFavorite(false);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "No se pudo crear el ejercicio."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border bg-white p-4 shadow-sm">
      <div>
        <label className="mb-1 block text-sm font-medium">Nombre</label>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ej: Press banca"
          className="w-full rounded-xl border px-3 py-2 outline-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Musculo principal</label>
          <select
            value={primaryMuscle}
            onChange={(event) => setPrimaryMuscle(event.target.value)}
            className="w-full rounded-xl border px-3 py-2 outline-none"
          >
            <option value="">Seleccionar musculo</option>
            {MUSCLE_GROUPS.map((muscle) => (
              <option key={muscle} value={muscle}>
                {muscle}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Region o musculo secundario</label>
          <input
            value={secondaryMuscle}
            onChange={(event) => setSecondaryMuscle(event.target.value)}
            placeholder="Ej: Triceps, Superior, Lateral..."
            className="w-full rounded-xl border px-3 py-2 outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Descripcion</label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Descripcion breve del ejercicio"
          className="min-h-20 w-full rounded-xl border px-3 py-2 outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Indicaciones y notas</label>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Tecnica, errores comunes, ajustes..."
          className="min-h-20 w-full rounded-xl border px-3 py-2 outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Video URL</label>
        <input
          value={youtubeUrl}
          onChange={(event) => setYoutubeUrl(event.target.value)}
          placeholder="https://youtube.com/..."
          className="w-full rounded-xl border px-3 py-2 outline-none"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isFavorite}
          onChange={(event) => setIsFavorite(event.target.checked)}
        />
        Marcar como favorito
      </label>

      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {isSubmitting ? "Guardando..." : "Guardar ejercicio personal"}
      </button>
    </form>
  );
}
