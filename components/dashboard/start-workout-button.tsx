"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";

import { createWorkoutSession } from "@/lib/workout-sessions";

export function StartWorkoutButton({
  routineId,
  dayId,
}: {
  routineId: string;
  dayId: string;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    try {
      setIsLoading(true);
      setError(null);

      const session = await createWorkoutSession({
        routineId,
        dayId,
      });

      router.push(`/workout/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar el entrenamiento.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mt-4 space-y-2">
      <button
        type="button"
        onClick={handleStart}
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        <Play className="h-4 w-4" />
        {isLoading ? "Iniciando..." : "Empezar entrenamiento"}
      </button>
      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
    </div>
  );
}