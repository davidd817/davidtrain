"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { setActiveRoutine } from "@/lib/training-state";

export function ActivateRoutineButton({
  routineId,
  nextDayIndex = 0,
  label = "Activar rutina",
}: {
  routineId: string;
  nextDayIndex?: number;
  label?: string;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleActivate() {
    try {
      setIsLoading(true);
      setError("");
      await setActiveRoutine({ routineId, nextDayIndex });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo activar la rutina.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <button
        type="button"
        onClick={handleActivate}
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        <CheckCircle2 className="h-4 w-4" />
        {isLoading ? "Activando..." : label}
      </button>
    </div>
  );
}
