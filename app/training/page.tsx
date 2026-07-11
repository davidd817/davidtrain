import { AppShell } from "@/components/layout/app-shell";
import { CreateExerciseForm } from "@/components/training/create-exercise-form";
import { getExercises } from "@/lib/exercises";

export default async function TrainingPage() {
  const exercises = await getExercises();

  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="mb-2 text-2xl font-bold">
          Biblioteca de ejercicios
        </h1>
        <p className="text-slate-500">
          Crea y gestiona tus ejercicios personales
        </p>
      </header>

      <div className="space-y-6">
        <CreateExerciseForm />

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Tus ejercicios</h2>

          {exercises.length === 0 ? (
            <div className="rounded-2xl border bg-white p-4 text-sm text-slate-500 shadow-sm">
              Aún no has creado ejercicios.
            </div>
          ) : (
            exercises.map((exercise) => (
              <article
                key={exercise.id}
                className="rounded-2xl border bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold">{exercise.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {exercise.primary_muscle || "Sin músculo principal"}
                      {exercise.secondary_muscle
                        ? ` · ${exercise.secondary_muscle}`
                        : ""}
                    </p>
                  </div>

                  {exercise.is_favorite ? (
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium">
                      Favorito
                    </span>
                  ) : null}
                </div>

                {exercise.description ? (
                  <p className="mt-3 text-sm text-slate-600">
                    {exercise.description}
                  </p>
                ) : null}

                {exercise.notes ? (
                  <p className="mt-2 text-sm text-slate-500">
                    {exercise.notes}
                  </p>
                ) : null}

                {exercise.youtube_url ? (
                  <a
                    href={exercise.youtube_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block text-sm font-medium text-slate-900 underline"
                  >
                    Ver vídeo
                  </a>
                ) : null}
              </article>
            ))
          )}
        </section>
      </div>
    </AppShell>
  );
}