"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import {
  sendPasswordReset,
  signInWithPassword,
  signUpWithPassword,
  updatePassword,
} from "@/lib/auth-actions";

type Mode = "login" | "register" | "recover" | "update-password";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const title = {
    login: "Iniciar sesion",
    register: "Crear cuenta",
    recover: "Recuperar contrasena",
    "update-password": "Nueva contrasena",
  }[mode];

  const button = {
    login: "Entrar",
    register: "Registrarme",
    recover: "Enviar enlace",
    "update-password": "Actualizar contrasena",
  }[mode];

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    startTransition(async () => {
      const result =
        mode === "login"
          ? await signInWithPassword({ email: email.trim(), password })
          : mode === "register"
            ? await signUpWithPassword({ email: email.trim(), password })
            : mode === "recover"
              ? await sendPasswordReset(email.trim())
              : await updatePassword(password);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (mode === "recover") {
        setMessage("Te hemos enviado un enlace de recuperacion.");
        return;
      }

      if (mode === "register") {
        setMessage("Cuenta creada. Si Supabase requiere confirmacion, revisa tu email.");
        if (result.needsEmailConfirmation) {
          return;
        }
      }

      const next = searchParams.get("next") || "/dashboard";
      router.push(mode === "update-password" ? "/dashboard" : next);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center bg-slate-50 px-4">
      <div className="w-full rounded-2xl border bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-500">Personal Trainer</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{title}</h1>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {mode !== "update-password" ? (
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border px-3 py-3"
              />
            </div>
          ) : null}

          {mode !== "recover" ? (
            <div>
              <label className="mb-1 block text-sm font-medium">Contrasena</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border px-3 py-3"
              />
            </div>
          ) : null}

          {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
          {message ? (
            <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {pending ? "Procesando..." : button}
          </button>
        </form>

        <div className="mt-5 space-y-2 text-sm text-slate-500">
          {mode !== "login" ? <Link href="/login">Ya tengo cuenta</Link> : null}
          {mode === "login" ? (
            <>
              <Link className="block" href="/register">
                Crear cuenta
              </Link>
              <Link className="block" href="/recover-password">
                He olvidado mi contrasena
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
