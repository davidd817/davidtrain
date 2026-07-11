"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { clearActiveRoutine } from "@/lib/training-state";

export function DeactivateRoutineButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    try {
      setBusy(true);
      setError("");
      await clearActiveRoutine();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo desactivar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900 disabled:opacity-50"
      >
        {busy ? "Desactivando..." : "Desactivar rutina"}
      </button>
    </div>
  );
}
