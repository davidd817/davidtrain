"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MUSCLE_GROUPS } from "@/lib/muscles";

import { createExercise } from "@/lib/exercises";

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("El nombre es obligatorio.");
      return;
    }

    try {
      setIsSubmitting(true);

      await createExercise({
        name: name.trim(),
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
        <label className="mb-1 block text-sm font-medium">Nombre *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Press banca"
          className="w-full rounded-xl border px-3 py-2 outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Músculo principal</label>
        <select
          value={primaryMuscle}
          onChange={(e) => setPrimaryMuscle(e.target.value)}
          className="w-full rounded-xl border px-3 py-2 outline-none"
        >
          <option value="">Seleccionar músculo</option>

          {MUSCLE_GROUPS.map((muscle) => (
            <option key={muscle} value={muscle}>
              {muscle}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Músculo secundario</label>
        <input
          value={secondaryMuscle}
          onChange={(e) => setSecondaryMuscle(e.target.value)}
          placeholder="Ej: Tríceps"
          className="w-full rounded-xl border px-3 py-2 outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Descripción</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción breve del ejercicio"
          className="min-h-24 w-full rounded-xl border px-3 py-2 outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Notas</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Indicaciones técnicas, errores comunes..."
          className="min-h-24 w-full rounded-xl border px-3 py-2 outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">YouTube URL</label>
        <input
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="https://youtube.com/..."
          className="w-full rounded-xl border px-3 py-2 outline-none"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isFavorite}
          onChange={(e) => setIsFavorite(e.target.checked)}
        />
        Marcar como favorito
      </label>

      {errorMessage ? (
        <p className="text-sm text-red-600">{errorMessage}</p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
      >
        {isSubmitting ? "Guardando..." : "Guardar ejercicio"}
      </button>
    </form>
  );
}