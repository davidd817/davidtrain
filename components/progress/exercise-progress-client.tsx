"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { estimateOneRepMax, formatDateTime, formatShortDate } from "@/lib/format";
import type { ExerciseProgressSet } from "@/lib/progress";

type Metric = "weight" | "e1rm" | "volume" | "reps";
type Period = "30" | "90" | "365" | "all";


type GroupedSession = {
  sessionId: string;
  startedAt: string;
  completedAt: string;
  routineName: string;
  dayName: string;
  sets: ExerciseProgressSet[];
};
type Point = {
  sessionId: string;
  at: string;
  label: string;
  value: number;
  bestSet: ExerciseProgressSet | null;
  setCount: number;
  volume: number;
  routineName: string;
  dayName: string;
  sets: ExerciseProgressSet[];
};

const metricLabels: Record<Metric, string> = {
  weight: "Peso maximo",
  e1rm: "e1RM",
  volume: "Volumen",
  reps: "Repeticiones",
};

export function ExerciseProgressClient({ sets }: { sets: ExerciseProgressSet[] }) {
  const [metric, setMetric] = useState<Metric>("weight");
  const [period, setPeriod] = useState<Period>("90");
  const [openSessionId, setOpenSessionId] = useState<string | null>(null);

  const points = useMemo(() => {
    const cutoff = getCutoff(period);
    const grouped = Object.values(groupBySession(sets))
      .filter((session) => !cutoff || new Date(session.completedAt).getTime() >= cutoff.getTime())
      .sort((a, b) => a.completedAt.localeCompare(b.completedAt));

    return grouped.map<Point>((session) => {
      const bestSet = session.sets.reduce<ExerciseProgressSet | null>((best, set) => {
        if (!best || set.weight > best.weight || (set.weight === best.weight && set.reps > best.reps)) {
          return set;
        }
        return best;
      }, null);
      const volume = session.sets.reduce((sum, set) => sum + set.weight * set.reps, 0);
      const maxE1rm = Math.max(...session.sets.map((set) => estimateOneRepMax(set.weight, set.reps)));
      const maxReps = Math.max(...session.sets.map((set) => set.reps));
      const maxWeight = Math.max(...session.sets.map((set) => set.weight));
      const value = metric === "weight" ? maxWeight : metric === "e1rm" ? maxE1rm : metric === "volume" ? volume : maxReps;

      return {
        sessionId: session.sessionId,
        at: session.completedAt,
        label: formatShortDate(session.completedAt),
        value: Math.round(value * 10) / 10,
        bestSet,
        setCount: session.sets.length,
        volume: Math.round(volume * 10) / 10,
        routineName: session.routineName,
        dayName: session.dayName,
        sets: session.sets.sort((a, b) => a.set_number - b.set_number),
      };
    });
  }, [metric, period, sets]);

  const bestWeight = Math.max(0, ...points.map((point) => point.bestSet?.weight ?? 0));
  const bestE1rm = Math.max(0, ...points.map((point) => point.sets.length ? Math.max(...point.sets.map((set) => estimateOneRepMax(set.weight, set.reps))) : 0));
  const bestVolume = Math.max(0, ...points.map((point) => point.volume));
  const trend = points.length >= 2 && points[0].value > 0
    ? Math.round(((points[points.length - 1].value - points[0].value) / points[0].value) * 1000) / 10
    : null;
  const recent = [...points].reverse().slice(0, 8);

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-3 gap-2">
        <Stat label="Mejor peso" value={`${bestWeight} kg`} />
        <Stat label="Mejor e1RM" value={`${Math.round(bestE1rm * 10) / 10} kg`} />
        <Stat label="Mejor volumen" value={`${bestVolume} kg`} />
      </section>

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <select value={metric} onChange={(event) => setMetric(event.target.value as Metric)} className="rounded-xl border px-3 py-2 text-sm">
            <option value="weight">Peso maximo</option>
            <option value="e1rm">e1RM</option>
            <option value="volume">Volumen</option>
            <option value="reps">Repeticiones</option>
          </select>
          <select value={period} onChange={(event) => setPeriod(event.target.value as Period)} className="rounded-xl border px-3 py-2 text-sm">
            <option value="30">30 dias</option>
            <option value="90">90 dias</option>
            <option value="365">1 ano</option>
            <option value="all">Todo</option>
          </select>
        </div>

        <div className="mt-4">
          <p className="text-sm font-semibold">{metricLabels[metric]}</p>
          {trend == null ? (
            <p className="mt-1 text-sm text-slate-500">Aun no hay datos suficientes para calcular tendencia.</p>
          ) : (
            <p className={`mt-1 text-sm font-semibold ${trend >= 0 ? "text-emerald-700" : "text-red-700"}`}>
              Tendencia: {trend >= 0 ? "+" : ""}{trend}%
            </p>
          )}
        </div>

        <ProgressChart points={points} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Historial reciente</h2>
        {recent.length === 0 ? (
          <div className="rounded-2xl border bg-white p-4 text-sm text-slate-500">
            Este ejercicio no tiene sesiones completadas en el periodo seleccionado.
          </div>
        ) : (
          recent.map((session) => (
            <article key={session.sessionId} className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold">{session.dayName}</h3>
                  <p className="mt-1 text-sm text-slate-500">{session.routineName}</p>
                  <p className="mt-1 text-xs text-slate-400">{formatDateTime(session.at)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenSessionId(openSessionId === session.sessionId ? null : session.sessionId)}
                  className="rounded-xl border px-3 py-2 text-xs font-semibold"
                >
                  {openSessionId === session.sessionId ? "Ocultar" : "Ver series"}
                </button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <Info label="Mejor serie" value={session.bestSet ? `${session.bestSet.weight} kg x ${session.bestSet.reps}` : "Sin serie"} />
                <Info label="Series" value={String(session.setCount)} />
              </div>
              {openSessionId === session.sessionId ? (
                <div className="mt-3 space-y-2">
                  {session.sets.map((set) => (
                    <div key={set.id} className="grid grid-cols-4 rounded-xl bg-slate-50 px-3 py-2 text-sm">
                      <span className="font-semibold">S{set.set_number}</span>
                      <span>{set.weight} kg</span>
                      <span>{set.reps} reps</span>
                      <span>RIR {set.rir}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          ))
        )}
      </section>

      <Link href="/progress" className="block rounded-xl border px-4 py-3 text-center text-sm font-semibold text-slate-700">
        Volver a progreso
      </Link>
    </div>
  );
}


function groupBySession(sets: ExerciseProgressSet[]) {
  return sets.reduce<Record<string, GroupedSession>>((acc, set) => {
    const session = set.workout_sessions;
    const key = set.session_id;

    if (!acc[key]) {
      acc[key] = {
        sessionId: key,
        startedAt: session.started_at,
        completedAt: session.completed_at ?? session.started_at,
        routineName: session.workout_routines?.name ?? "Sin rutina",
        dayName: session.workout_days?.name ?? "Entrenamiento",
        sets: [],
      };
    }

    acc[key].sets.push(set);
    return acc;
  }, {});
}
function getCutoff(period: Period) {
  if (period === "all") {
    return null;
  }

  const date = new Date();
  date.setDate(date.getDate() - Number(period));
  return date;
}

function ProgressChart({ points }: { points: Point[] }) {
  if (points.length < 2) {
    return (
      <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
        Se necesitan al menos dos sesiones para mostrar la grafica.
      </div>
    );
  }

  const width = 320;
  const height = 150;
  const padding = 18;
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const coords = points.map((point, index) => {
    const x = padding + (index / Math.max(1, points.length - 1)) * (width - padding * 2);
    const y = height - padding - ((point.value - min) / range) * (height - padding * 2);
    return { x, y, point };
  });
  const line = coords.map((item) => `${item.x},${item.y}`).join(" ");

  return (
    <div className="mt-4 overflow-hidden rounded-xl bg-slate-50 p-2">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Grafica de progreso" className="h-44 w-full">
        <polyline points={line} fill="none" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map(({ x, y, point }) => (
          <circle key={point.sessionId} cx={x} cy={y} r="4" fill="#10b981">
            <title>{`${point.label}: ${point.value}`}</title>
          </circle>
        ))}
        <text x={padding} y={height - 2} fontSize="10" fill="#64748b">{points[0].label}</text>
        <text x={width - padding - 42} y={height - 2} fontSize="10" fill="#64748b">{points[points.length - 1].label}</text>
      </svg>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white p-3 shadow-sm">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-2">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
