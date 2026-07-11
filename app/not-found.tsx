import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center bg-slate-50 px-4">
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-slate-500">No encontrado</p>
        <h1 className="mt-2 text-xl font-bold">Esta pantalla ya no existe</h1>
        <p className="mt-2 text-sm text-slate-500">
          Puede que el registro se haya archivado o que el enlace no sea valido.
        </p>
        <Link
          href="/dashboard"
          className="mt-4 block w-full rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-medium text-white"
        >
          Ir al dashboard
        </Link>
      </div>
    </div>
  );
}
