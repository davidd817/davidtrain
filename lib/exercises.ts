"use server";

import { createClient, getUserId } from "@/lib/supabase/server";
import type { Exercise } from "@/lib/types";

type CreateExerciseInput = {
  name: string;
  primary_muscle?: string;
  secondary_muscle?: string;
  description?: string;
  notes?: string;
  youtube_url?: string;
  is_favorite?: boolean;
};

type UpdateExerciseInput = CreateExerciseInput & {
  id: string;
};

export async function getExercises({
  includeArchived = false,
}: {
  includeArchived?: boolean;
} = {}): Promise<Exercise[]> {
  const supabase = await createClient();
  const userId = await getUserId();

  let query = supabase
    .from("exercises")
    .select("*")
    .eq("user_id", userId)
    .order("is_favorite", { ascending: false })
    .order("name", { ascending: true });

  if (!includeArchived) {
    query = query.is("archived_at", null);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Exercise[];
}

export async function getExerciseById(exerciseId: string): Promise<Exercise | null> {
  const supabase = await createClient();
  const userId = await getUserId();

  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("id", exerciseId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Exercise | null;
}

export async function createExercise(input: CreateExerciseInput) {
  const supabase = await createClient();
  const userId = await getUserId();

  const { data, error } = await supabase
    .from("exercises")
    .insert({
      user_id: userId,
      name: input.name,
      primary_muscle: input.primary_muscle || null,
      secondary_muscle: input.secondary_muscle || null,
      description: input.description || null,
      notes: input.notes || null,
      youtube_url: input.youtube_url || null,
      is_favorite: input.is_favorite ?? false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Exercise;
}

export async function updateExercise(input: UpdateExerciseInput) {
  const supabase = await createClient();
  const userId = await getUserId();

  const { data, error } = await supabase
    .from("exercises")
    .update({
      name: input.name,
      primary_muscle: input.primary_muscle || null,
      secondary_muscle: input.secondary_muscle || null,
      description: input.description || null,
      notes: input.notes || null,
      youtube_url: input.youtube_url || null,
      is_favorite: input.is_favorite ?? false,
    })
    .eq("id", input.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Exercise;
}

export async function setExerciseFavorite({
  exerciseId,
  isFavorite,
}: {
  exerciseId: string;
  isFavorite: boolean;
}) {
  const supabase = await createClient();
  const userId = await getUserId();

  const { error } = await supabase
    .from("exercises")
    .update({ is_favorite: isFavorite })
    .eq("id", exerciseId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function archiveExercise(exerciseId: string) {
  const supabase = await createClient();
  const userId = await getUserId();

  const { error } = await supabase
    .from("exercises")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", exerciseId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteExerciseIfUnused(exerciseId: string) {
  const supabase = await createClient();
  const userId = await getUserId();

  const exercise = await getExerciseById(exerciseId);

  if (!exercise) {
    throw new Error("Ejercicio no encontrado.");
  }

  const [{ count: plannedCount, error: plannedError }, { count: logCount, error: logError }] =
    await Promise.all([
      supabase
        .from("exercises_in_day")
        .select("id", { count: "exact", head: true })
        .eq("exercise_id", exerciseId),
      supabase
        .from("exercise_logs")
        .select("id, workout_sessions!inner(user_id)", { count: "exact", head: true })
        .eq("exercise_id", exerciseId)
        .eq("workout_sessions.user_id", userId),
    ]);

  if (plannedError) {
    throw new Error(plannedError.message);
  }

  if (logError) {
    throw new Error(logError.message);
  }

  if ((plannedCount ?? 0) > 0 || (logCount ?? 0) > 0) {
    throw new Error("Este ejercicio ya se usa. Archivarlo conserva rutinas e historial.");
  }

  const { error } = await supabase
    .from("exercises")
    .delete()
    .eq("id", exerciseId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}
