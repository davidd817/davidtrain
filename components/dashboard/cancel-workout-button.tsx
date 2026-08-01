"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";

import { cancelWorkoutSession } from "@/lib/workout-sessions";

export function CancelWorkoutButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleCancel() {
    try {
      setIsCancelling(true);
      setError("");
      await cancelWorkoutSession({ sessionId });
      setIsOpen(false);
      setMessage("Entrenamiento cancelado");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cancelar el entrenamiento.");
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <div className="mt-2 space-y-2">
      <button
        type="button"
        onClick={() => {
          setError("");
          setIsOpen(true);
        }}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-700"
      >
        <XCircle className="h-4 w-4" />
        Cancelar entrenamiento
      </button>

      {message ? <p className="text-sm font-semibold text-emerald-700">{message}</p> : null}

      {isOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-workout-title"
          className="fixed inset-0 z-50 flex items-end bg-slate-900/40 p-4 sm:items-center sm:justify-center"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
            <h2 id="cancel-workout-title" className="text-lg font-bold">
              ¿Cancelar este entrenamiento?
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Volverás a tener este mismo día disponible. Las series registradas no contarán en tu historial ni en tu progreso.
            </p>

            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isCancelling}
                className="rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700 disabled:opacity-50"
              >
                Seguir entrenando
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isCancelling}
                className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isCancelling ? "Cancelando..." : "Cancelar entrenamiento"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
