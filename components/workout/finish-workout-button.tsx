"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { completeWorkoutSession } from "@/lib/workout-sessions";

export function FinishWorkoutButton({
  sessionId,
}: {
  sessionId: string;
}) {
  const router = useRouter();
  const [isFinishing, setIsFinishing] = useState(false);
  const [error, setError] = useState("");

  async function handleFinish() {
    try {
      setIsFinishing(true);
      setError("");

      await completeWorkoutSession({ sessionId });

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error finalizando entrenamiento."
      );
    } finally {
      setIsFinishing(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

      <button
        type="button"
        onClick={handleFinish}
        disabled={isFinishing}
        className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
      >
        {isFinishing ? "Finalizando..." : "Finalizar entrenamiento"}
      </button>
    </div>
  );
}