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

  async function handleStart() {
    try {
      setIsLoading(true);

      const session = await createWorkoutSession({
        routineId,
        dayId,
      });

      router.push(`/workout/${session.id}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleStart}
      disabled={isLoading}
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
    >
      <Play className="h-4 w-4" />
      {isLoading ? "Iniciando..." : "Empezar entrenamiento"}
    </button>
  );
}
