"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";

import { formatDateTime } from "@/lib/format";
import type { ExerciseProgressSummary, ProgressOverview } from "@/lib/progress";

type Tab = "summary" | "exercises";
type SortMode = "recent" | "improvement" | "name";

export function ProgressDashboardClient({
  overview,
  exercises,
}: {
  overview: ProgressOverview;
  exercises: ExerciseProgressSummary[];
}) {
  const [tab, setTab] = useState<Tab>("summary");
  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("recent");

  const muscles = useMemo(() => {
    return Array.from(new Set(exercises.map((item) => item.primaryMuscle).filter(Boolean))).sort() as string[];
  }, [exercises]);

  const filteredExercises = useMemo(() => {
    const term = search.trim().toLowerCase();

    return exercises
      .filter((exercise) => {
        const matchesSearch = term
          ? exercise.exerciseName.toLowerCase().includes(term) ||
            (exercise.primaryMuscle ?? "").toLowerCase().includes(term)
          : true;
        const matchesMuscle = muscle ? exercise.primaryMuscle === muscle : true;
        return matchesSearch && matchesMuscle;
      })
      .sort((a, b) => {
        if (sortMode === "name") {
          return a.exerciseName.localeCompare(b.exerciseName, "es");
        }

        if (sortMode === "improvement") {
          return (b.trendPercent ?? -999) - (a.trendPercent ?? -999);
        }

        return (b.latestAt ?? "").localeCompare(a.latestAt ?? "");
      });
  }, [exercises, muscle, search, sortMode]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2 rounded-2xl border bg-white p-2 shadow-sm">
        <TabButton active={tab === "summary"} onClick={() => setTab("summary")}>Resumen</TabButton>
        <TabButton active={tab === "exercises"} onClick={() => setTab("exercises")}>Ejercicios</TabButton>
      </div>

      {tab === "summary" ? (
        <section className="space-y-5">
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Completados" value={String(overview.completedCount)} />
            <Stat label="Ultimos 30 dias" value={String(overview.completedLast30)} />
            <Stat label="Series 30 dias" value={String(overview.setsLast30)} />
            <Stat label="Ejercicios" value={String(overview.exerciseCount)} />
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">Frecuencia semanal media</p>
            <p className="mt-2 text-3xl font-bold">{overview.weeklyFrequency}</p>
            <p className="mt-1 text-sm text-slate-500">entrenamientos por semana en los ultimos 30 dias</p>
          </div>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Actividad reciente</h2>
              <button type="button" onClick={() => setTab("exercises")} className="text-sm font-semibold text-slate-600">
                Ver ejercicios
              </button>
            </div>

            {overview.recentWorkouts.length === 0 ? (
              <EmptyState text="Completa entrenamientos para ver actividad reciente." />
            ) : (
              overview.recentWorkouts.map((session) => (
                <Link key={session.id} href={`/history/${session.id}`} className="block rounded-2xl border bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold">{session.workout_days?.name ?? "Entrenamiento"}</h3>
                      <p className="mt-1 text-sm text-slate-500">{session.workout_routines?.name ?? "Sin rutina"}</p>
                      <p className="mt-1 text-xs text-slate-400">{formatDateTime(session.completed_at ?? session.started_at)}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <Info label="Ejercicios" value={String(session.exercise_count)} />
                    <Info label="Series" value={String(session.set_count)} />
                  </div>
                </Link>
              ))
            )}
          </section>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <label className="flex items-center gap-2 rounded-xl border px-3 py-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar ejercicio"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
            </label>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <select value={muscle} onChange={(event) => setMuscle(event.target.value)} className="rounded-xl border px-3 py-2 text-sm">
                <option value="">Todos los musculos</option>
                {muscles.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)} className="rounded-xl border px-3 py-2 text-sm">
                <option value="recent">Actividad reciente</option>
                <option value="improvement">Mayor mejora</option>
                <option value="name">Nombre</option>
              </select>
            </div>
          </div>

          {filteredExercises.length === 0 ? (
            <EmptyState text="No hay ejercicios con progreso para estos filtros." />
          ) : (
            filteredExercises.map((exercise) => (
              <Link key={exercise.exerciseId} href={`/progress/exercise/${exercise.exerciseId}`} className="block rounded-2xl border bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-bold">{exercise.exerciseName}</h3>
                    <p className="mt-1 text-sm text-slate-500">{exercise.primaryMuscle ?? "Sin grupo"}</p>
                  </div>
                  <Trend value={exercise.trendPercent} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <Info label="Mejor peso" value={`${exercise.bestWeight} kg`} />
                  <Info label="Mejor e1RM" value={`${exercise.bestEstimatedOneRm} kg`} />
                  <Info label="Ultima marca" value={exercise.latestMark} />
                  <Info label="Sesiones" value={String(exercise.sessionCount)} />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900">Ver progreso</p>
              </Link>
            ))
          )}
        </section>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-3 text-sm font-semibold ${active ? "bg-slate-900 text-white" : "text-slate-600"}`}
    >
      {children}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-2">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="truncate font-semibold">{value}</p>
    </div>
  );
}

function Trend({ value }: { value: number | null }) {
  if (value == null) {
    return <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">Sin tendencia</span>;
  }

  const positive = value >= 0;
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${positive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
      {positive ? "+" : ""}{value}%
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-2xl border bg-white p-4 text-sm text-slate-500 shadow-sm">{text}</div>;
}
