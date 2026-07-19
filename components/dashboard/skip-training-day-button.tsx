"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SkipForward } from "lucide-react";

import { skipCurrentTrainingDay } from "@/lib/training-state";

export function SkipTrainingDayButton({ disabled = false }: { disabled?: boolean }) {
  const router = useRouter();
  const [isSkipping, setIsSkipping] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSkip() {
    if (disabled) {
      setError("Hay una sesion abierta. Continuala o finalizala antes de saltar el dia.");
      return;
    }

    if (!window.confirm("Saltar este dia y pasar al siguiente de la rutina?")) {
      return;
    }

    try {
      setIsSkipping(true);
      setError("");
      setMessage("");
      const result = await skipCurrentTrainingDay();
      setMessage(`${result.skippedDayName} saltado. Proximo: ${result.nextDayName}.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo saltar el dia.");
    } finally {
      setIsSkipping(false);
    }
  }

  return (
    <div className="mt-2 space-y-2">
      <button
        type="button"
        onClick={handleSkip}
        disabled={disabled || isSkipping}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <SkipForward className="h-4 w-4" />
        {isSkipping ? "Saltando..." : "Saltar este dia"}
      </button>
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
