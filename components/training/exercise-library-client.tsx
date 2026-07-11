"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, BarChart3, ExternalLink, PenLine, Star, Trash2 } from "lucide-react";

import {
  archiveExercise,
  deleteExerciseIfUnused,
  setExerciseFavorite,
  updateExercise,
} from "@/lib/exercises";
import type { Exercise } from "@/lib/types";

export function ExerciseLibraryClient({ exercises }: { exercises: Exercise[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState("");
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const muscles = useMemo(() => {
    return Array.from(new Set(exercises.map((item) => item.primary_muscle).filter(Boolean))).sort() as string[];
  }, [exercises]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return exercises.filter((exercise) => {
      const matchesSearch =
        !term ||
        exercise.name.toLowerCase().includes(term) ||
        (exercise.secondary_muscle ?? "").toLowerCase().includes(term);
      const matchesMuscle = muscle ? exercise.primary_muscle === muscle : true;
      const matchesFavorite = favoriteOnly ? exercise.is_favorite : true;

      return matchesSearch && matchesMuscle && matchesFavorite;
    });
  }, [exercises, favoriteOnly, muscle, search]);

  async function run(callback: () => Promise<void>) {
    try {
      setError("");
      await callback();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo completar la accion.");
    }
  }

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar ejercicio..."
            className="w-full rounded-xl border px-3 py-2"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={muscle}
              onChange={(event) => setMuscle(event.target.value)}
              className="rounded-xl border px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              {muscles.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setFavoriteOnly((value) => !value)}
              className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                favoriteOnly ? "bg-slate-900 text-white" : "bg-white text-slate-900"
              }`}
            >
              Favoritos
            </button>
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-500">
          {filtered.length} de {exercises.length} ejercicios
        </p>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border bg-white p-4 text-sm text-slate-500">
          No hay ejercicios que coincidan con el filtro.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((exercise) => (
            <article key={exercise.id} className="rounded-2xl border bg-white p-4 shadow-sm">
              {editingId === exercise.id ? (
                <ExerciseEditForm
                  exercise={exercise}
                  onCancel={() => setEditingId(null)}
                  onSave={async (input) => {
                    await run(async () => {
                      await updateExercise(input);
                      setEditingId(null);
                    });
                  }}
                />
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-bold">{exercise.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {exercise.primary_muscle || "Sin musculo"}
                        {exercise.secondary_muscle ? ` - ${exercise.secondary_muscle}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      title="Favorito"
                      aria-label="Favorito"
                      onClick={() =>
                        run(async () =>
                          setExerciseFavorite({
                            exerciseId: exercise.id,
                            isFavorite: !exercise.is_favorite,
                          })
                        )
                      }
                      className="rounded-full bg-slate-100 p-2"
                    >
                      <Star
                        className={`h-4 w-4 ${
                          exercise.is_favorite ? "fill-amber-400 text-amber-500" : "text-slate-500"
                        }`}
                      />
                    </button>
                  </div>

                  {exercise.description ? (
                    <p className="mt-3 text-sm text-slate-600">{exercise.description}</p>
                  ) : null}

                  {exercise.notes ? (
                    <p className="mt-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                      {exercise.notes}
                    </p>
                  ) : null}

                  <div className="mt-3 grid grid-cols-5 gap-2">
                    <IconButton label="Editar" onClick={() => setEditingId(exercise.id)}>
                      <PenLine className="h-4 w-4" />
                    </IconButton>
                    <Link
                      title="Progreso"
                      aria-label="Progreso"
                      href={`/progress/${exercise.id}`}
                      className="flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2"
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Link>
                    {exercise.youtube_url ? (
                      <a
                        title="Video"
                        aria-label="Video"
                        href={exercise.youtube_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : (
                      <span className="rounded-xl border border-slate-100 px-3 py-2" />
                    )}
                    <IconButton
                      label="Archivar"
                      onClick={() => {
                        if (window.confirm("Archivar este ejercicio?")) {
                          void run(async () => archiveExercise(exercise.id));
                        }
                      }}
                    >
                      <Archive className="h-4 w-4" />
                    </IconButton>
                    <IconButton
                      label="Eliminar"
                      danger
                      onClick={() => {
                        if (window.confirm("Eliminar solo si no se usa en rutinas ni historial?")) {
                          void run(async () => deleteExerciseIfUnused(exercise.id));
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function ExerciseEditForm({
  exercise,
  onCancel,
  onSave,
}: {
  exercise: Exercise;
  onCancel: () => void;
  onSave: (input: {
    id: string;
    name: string;
    primary_muscle?: string;
    secondary_muscle?: string;
    description?: string;
    notes?: string;
    youtube_url?: string;
    is_favorite?: boolean;
  }) => Promise<void>;
}) {
  const [name, setName] = useState(exercise.name);
  const [primaryMuscle, setPrimaryMuscle] = useState(exercise.primary_muscle ?? "");
  const [secondaryMuscle, setSecondaryMuscle] = useState(exercise.secondary_muscle ?? "");
  const [description, setDescription] = useState(exercise.description ?? "");
  const [notes, setNotes] = useState(exercise.notes ?? "");
  const [youtubeUrl, setYoutubeUrl] = useState(exercise.youtube_url ?? "");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSave({
      id: exercise.id,
      name: name.trim(),
      primary_muscle: primaryMuscle.trim(),
      secondary_muscle: secondaryMuscle.trim(),
      description: description.trim(),
      notes: notes.trim(),
      youtube_url: youtubeUrl.trim(),
      is_favorite: exercise.is_favorite,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" />
      <div className="grid grid-cols-2 gap-2">
        <input value={primaryMuscle} onChange={(event) => setPrimaryMuscle(event.target.value)} className="rounded-lg border px-3 py-2 text-sm" />
        <input value={secondaryMuscle} onChange={(event) => setSecondaryMuscle(event.target.value)} className="rounded-lg border px-3 py-2 text-sm" />
      </div>
      <textarea value={description} onChange={(event) => setDescription(event.target.value)} className="min-h-16 w-full rounded-lg border px-3 py-2 text-sm" />
      <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="min-h-16 w-full rounded-lg border px-3 py-2 text-sm" />
      <input value={youtubeUrl} onChange={(event) => setYoutubeUrl(event.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" />
      <div className="grid grid-cols-2 gap-2">
        <button className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
          Guardar
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg border px-3 py-2 text-sm font-semibold">
          Cancelar
        </button>
      </div>
    </form>
  );
}

function IconButton({
  label,
  children,
  danger,
  onClick,
}: {
  label: string;
  children: React.ReactNode;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`flex items-center justify-center rounded-xl border px-3 py-2 ${
        danger ? "border-red-200 text-red-700" : "border-slate-200 text-slate-800"
      }`}
    >
      {children}
    </button>
  );
}
