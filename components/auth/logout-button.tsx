"use client";

import { LogOut } from "lucide-react";
import { useTransition } from "react";

import { signOut } from "@/lib/auth-actions";

export function LogoutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      title="Cerrar sesion"
      aria-label="Cerrar sesion"
      disabled={pending}
      onClick={() => startTransition(() => void signOut())}
      className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 disabled:opacity-50"
    >
      <LogOut className="h-4 w-4" />
    </button>
  );
}
