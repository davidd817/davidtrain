"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { completeWorkoutSession } from "@/lib/workout-sessions";

export function FinishWorkoutButton({
  sessionId,
  missingSets,
}: {
  sessionId: string;
  missingSets: number;
}) {
  const router = useRouter();
  const [isFinishing, setIsFinishing] = useState(false);
  const [forceConfirm, setForceConfirm] = useState(false);
  const [error, setError] = useState("");

  async function handleFinish() {
    if (missingSets > 0 && !forceConfirm) {
      setForceConfirm(true);
      return;
    }

    try {
      setIsFinishing(true);
      setError("");
      await completeWorkoutSession({ sessionId, allowIncomplete: forceConfirm });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error finalizando entrenamiento.");
      if (missingSets > 0) {
        setForceConfirm(true);
      }
    } finally {
      setIsFinishing(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      {missingSets > 0 ? (
        <p className="mb-3 text-sm text-amber-700">
          Faltan {missingSets} series por guardar.
        </p>
      ) : null}

      {forceConfirm ? (
        <p className="mb-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          Puedes finalizar igualmente. La sesion quedara guardada con las series actuales.
        </p>
      ) : null}

      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

      <button
        type="button"
        onClick={handleFinish}
        disabled={isFinishing}
        className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {isFinishing
          ? "Finalizando..."
          : forceConfirm
            ? "Finalizar igualmente"
            : "Finalizar entrenamiento"}
      </button>
    </div>
  );
}
