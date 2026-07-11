"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center bg-slate-50 px-4">
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-red-600">Algo no ha ido bien</p>
        <h1 className="mt-2 text-xl font-bold">No se pudo cargar esta vista</h1>
        <p className="mt-2 text-sm text-slate-500">
          Reintenta la carga. Si vuelve a pasar, revisa la conexion con Supabase.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
