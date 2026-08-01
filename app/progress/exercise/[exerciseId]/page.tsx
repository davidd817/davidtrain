import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { ExerciseProgressClient } from "@/components/progress/exercise-progress-client";
import { getExerciseById } from "@/lib/exercises";
import { getExerciseProgress } from "@/lib/progress";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    exerciseId: string;
  }>;
};

export default async function ExerciseProgressDetailPage({ params }: Props) {
  const { exerciseId } = await params;
  const [exercise, progress] = await Promise.all([
    getExerciseById(exerciseId),
    getExerciseProgress(exerciseId),
  ]);

  if (!exercise) {
    notFound();
  }

  return (
    <AppShell>
      <header className="mb-5">
        <p className="text-sm font-medium text-slate-500">{exercise.primary_muscle ?? "Sin grupo"}</p>
        <h1 className="text-3xl font-bold tracking-tight">{exercise.name}</h1>
      </header>

      <ExerciseProgressClient sets={progress.sets} />
    </AppShell>
  );
}
