"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { setActiveRoutine } from "@/lib/training-state";

export function ActivateRoutineButton({
  routineId,
}: {
  routineId: string;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleActivate() {
    try {
      setIsLoading(true);
      await setActiveRoutine(routineId);
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleActivate}
      disabled={isLoading}
      className="w-full rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
    >
      {isLoading ? "Activando..." : "Activar rutina"}
    </button>
  );
}