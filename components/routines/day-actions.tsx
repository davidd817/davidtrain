"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArrowDown, ArrowUp, Copy, PenLine } from "lucide-react";

import { ActionTile } from "@/components/ui/action-tile";
import {
  archiveWorkoutDay,
  duplicateWorkoutDay,
  moveWorkoutDay,
  updateWorkoutDay,
} from "@/lib/workout-days";

export function DayActions({
  routineId,
  dayId,
  initialName,
}: {
  routineId: string;
  dayId: string;
  initialName: string;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  async function run(action: string, callback: () => Promise<void>) {
    try {
      setBusy(action);
      setError("");
      await callback();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo completar la accion.");
    } finally {
      setBusy("");
    }
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();

    if (cleanName.length < 2) {
      setError("El nombre debe tener al menos 2 caracteres.");
      return;
    }

    await run("edit", async () => {
      await updateWorkoutDay({ dayId, name: cleanName });
      setIsEditing(false);
    });
  }

  return (
    <div className="space-y-2">
      {isEditing ? (
        <form onSubmit={handleUpdate} className="flex gap-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm"
          />
          <button className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
            OK
          </button>
        </form>
      ) : null}

      {error ? <p className="text-xs text-red-600">{error}</p> : null}

      <div className="grid grid-cols-5 gap-2">
        <ActionTile label="Editar" icon={<PenLine />} disabled={Boolean(busy)} onClick={() => setIsEditing(true)} />
        <ActionTile
          label="Subir"
          icon={<ArrowUp />}
          disabled={Boolean(busy)}
          onClick={() => run("up", async () => moveWorkoutDay({ routineId, dayId, direction: "up" }))}
        />
        <ActionTile
          label="Bajar"
          icon={<ArrowDown />}
          disabled={Boolean(busy)}
          onClick={() => run("down", async () => moveWorkoutDay({ routineId, dayId, direction: "down" }))}
        />
        <ActionTile
          label="Duplicar"
          icon={<Copy />}
          disabled={Boolean(busy)}
          onClick={() => run("copy", async () => void (await duplicateWorkoutDay(dayId)))}
        />
        <ActionTile
          label="Archivar"
          icon={<Archive />}
          disabled={Boolean(busy)}
          onClick={() => {
            if (window.confirm("Archivar este dia? El historial se conserva.")) {
              void run("archive", async () => archiveWorkoutDay(dayId));
            }
          }}
        />
      </div>
    </div>
  );
}
