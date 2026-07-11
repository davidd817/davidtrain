export default function Loading() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center bg-slate-50 px-4">
      <div className="w-full rounded-2xl border bg-white p-5 shadow-sm">
        <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
        <div className="mt-4 h-8 w-44 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-24 animate-pulse rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}
