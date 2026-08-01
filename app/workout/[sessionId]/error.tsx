"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function WorkoutSessionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Workout route error", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950">
      <div className="mx-auto max-w-md rounded-2xl border bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Entrenamiento</p>
        <h1 className="mt-2 text-2xl font-bold">No hemos podido cargar este entrenamiento.</h1>
        <p className="mt-2 text-sm text-slate-600">
          Reintenta la carga o vuelve al inicio para continuar desde el dashboard.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={reset}
            className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
          >
            Reintentar
          </button>
          <Link
            href="/dashboard"
            className="rounded-xl border px-4 py-3 text-center text-sm font-semibold text-slate-700"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
