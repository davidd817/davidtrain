import { AppShell } from "@/components/layout/app-shell";
import { CreateExerciseForm } from "@/components/training/create-exercise-form";
import { ExerciseLibraryClient } from "@/components/training/exercise-library-client";
import { getExercises } from "@/lib/exercises";

export const dynamic = "force-dynamic";

export default async function TrainingPage() {
  const exercises = await getExercises();

  return (
    <AppShell>
      <header className="mb-5">
        <p className="text-sm font-medium text-slate-500">Biblioteca</p>
        <h1 className="text-3xl font-bold tracking-tight">Ejercicios</h1>
        <p className="mt-1 text-sm text-slate-500">
          Busca, filtra, edita y consulta progreso por ejercicio.
        </p>
      </header>

      <div className="space-y-5">
        <CreateExerciseForm />
        <ExerciseLibraryClient exercises={exercises} />
      </div>
    </AppShell>
  );
}
