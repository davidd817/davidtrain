"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Copy, PenLine, Trash2 } from "lucide-react";

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

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
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
        <IconButton label="Editar" disabled={Boolean(busy)} onClick={() => setIsEditing(true)}>
          <PenLine className="h-4 w-4" />
        </IconButton>
        <IconButton
          label="Duplicar"
          disabled={Boolean(busy)}
          onClick={() => run("copy", async () => void (await duplicateRoutine(routineId)))}
        >
          <Copy className="h-4 w-4" />
        </IconButton>
        <IconButton
          label="Archivar"
          disabled={Boolean(busy)}
          onClick={() => {
            if (window.confirm("Archivar esta rutina? No se borrara el historial.")) {
              void run("archive", async () => archiveRoutine(routineId));
            }
          }}
        >
          <Archive className="h-4 w-4" />
        </IconButton>
        <IconButton
          label="Eliminar"
          disabled={Boolean(busy)}
          danger
          onClick={() => {
            if (window.confirm("Eliminar solo si no tiene historial?")) {
              void run("delete", async () => deleteRoutineIfSafe(routineId));
            }
          }}
        >
          <Trash2 className="h-4 w-4" />
        </IconButton>
      </div>
    </div>
  );
}

function IconButton({
  label,
  children,
  disabled,
  danger,
  onClick,
}: {
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center justify-center rounded-xl border px-3 py-2 text-sm font-semibold disabled:opacity-50 ${
        danger ? "border-red-200 text-red-700" : "border-slate-200 text-slate-800"
      }`}
    >
      {children}
    </button>
  );
}
