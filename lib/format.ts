export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatShortDate(value: string | null | undefined) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

export function formatDuration(seconds: number | null | undefined) {
  if (!seconds || seconds <= 0) {
    return "0 min";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.max(1, Math.round((seconds % 3600) / 60));

  if (hours <= 0) {
    return `${minutes} min`;
  }

  return `${hours} h ${minutes} min`;
}

export function secondsBetween(start: string, end: string | null | undefined) {
  const startMs = new Date(start).getTime();
  const endMs = end ? new Date(end).getTime() : Date.now();

  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
    return 0;
  }

  return Math.max(0, Math.round((endMs - startMs) / 1000));
}

export function estimateOneRepMax(weight: number, reps: number) {
  if (weight <= 0 || reps <= 0) {
    return 0;
  }

  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}
