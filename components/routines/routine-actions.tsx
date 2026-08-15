"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Copy, PenLine, Trash2 } from "lucide-react";

import { ActionTile } from "@/components/ui/action-tile";
import {
  archiveRoutine,
  deleteRoutineIfSafe,
  duplicateRoutine,
  updateRoutine,
} from "@/lib/routines";

export function RoutineActions({
  routineId,
  initialName,
  initialDescription,
}: {
  routineId: string;
  initialName: string;
  initialDescription: string | null;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription ?? "");
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
      await updateRoutine({
        routineId,
        name: cleanName,
        description: description.trim(),
      });
      setIsEditing(false);
    });
  }

  return (
    <div className="space-y-3">
      {isEditing ? (
        <form onSubmit={handleUpdate} className="space-y-2 rounded-xl bg-slate-50 p-3">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="min-h-16 w-full rounded-lg border px-3 py-2 text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <button className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-lg border px-3 py-2 text-sm font-semibold"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

      {error ? <p className="text-xs text-red-600">{error}</p> : null}

      <div className="grid grid-cols-4 gap-2">
        <ActionTile label="Editar" icon={<PenLine />} disabled={Boolean(busy)} onClick={() => setIsEditing(true)} />
        <ActionTile
          label="Duplicar"
          icon={<Copy />}
          disabled={Boolean(busy)}
          onClick={() => run("copy", async () => void (await duplicateRoutine(routineId)))}
        />
        <ActionTile
          label="Archivar"
          icon={<Archive />}
          disabled={Boolean(busy)}
          onClick={() => {
            if (window.confirm("Archivar esta rutina? No se borrara el historial.")) {
              void run("archive", async () => archiveRoutine(routineId));
            }
          }}
        />
        <ActionTile
          label="Eliminar"
          icon={<Trash2 />}
          disabled={Boolean(busy)}
          danger
          onClick={() => {
            if (window.confirm("Eliminar solo si no tiene historial?")) {
              void run("delete", async () => deleteRoutineIfSafe(routineId));
            }
          }}
        />
      </div>
    </div>
  );
}
