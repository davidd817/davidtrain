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

function visibleExerciseFilter(userId: string) {
  return `is_global.eq.true,user_id.eq.${userId}`;
}

async function getFavoriteIds(exerciseIds: string[]) {
  if (exerciseIds.length === 0) {
    return new Set<string>();
  }

  const supabase = await createClient();
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("user_exercise_favorites")
    .select("exercise_id")
    .eq("user_id", userId)
    .in("exercise_id", exerciseIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Set((data ?? []).map((favorite) => favorite.exercise_id as string));
}

async function withFavoriteState(exercises: Exercise[]) {
  const favoriteIds = await getFavoriteIds(exercises.map((exercise) => exercise.id));

  return exercises
    .map((exercise) => ({
      ...exercise,
      is_favorite: favoriteIds.has(exercise.id),
    }))
    .sort((a, b) => {
      if (a.is_favorite !== b.is_favorite) {
        return a.is_favorite ? -1 : 1;
      }

      if (Boolean(a.is_global) !== Boolean(b.is_global)) {
        return a.is_global ? -1 : 1;
      }

      return a.name.localeCompare(b.name, "es");
    });
}

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
    .or(visibleExerciseFilter(userId))
    .order("name", { ascending: true });

  if (!includeArchived) {
    query = query.is("archived_at", null);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return withFavoriteState((data ?? []) as Exercise[]);
}

export async function getExerciseById(exerciseId: string): Promise<Exercise | null> {
  const supabase = await createClient();
  const userId = await getUserId();

  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("id", exerciseId)
    .or(visibleExerciseFilter(userId))
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const [exercise] = await withFavoriteState([data as Exercise]);
  return exercise ?? null;
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
      is_favorite: false,
      is_global: false,
      source_exercise_id: null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const exercise = data as Exercise;

  if (input.is_favorite) {
    await setExerciseFavorite({ exerciseId: exercise.id, isFavorite: true });
    return { ...exercise, is_favorite: true };
  }

  return { ...exercise, is_favorite: false };
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
    })
    .eq("id", input.id)
    .eq("user_id", userId)
    .eq("is_global", false)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const [exercise] = await withFavoriteState([data as Exercise]);
  return exercise;
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
  const exercise = await getExerciseById(exerciseId);

  if (!exercise) {
    throw new Error("Ejercicio no encontrado.");
  }

  if (isFavorite) {
    const { error } = await supabase.from("user_exercise_favorites").upsert(
      {
        user_id: userId,
        exercise_id: exerciseId,
      },
      { onConflict: "user_id,exercise_id" }
    );

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  const { error } = await supabase
    .from("user_exercise_favorites")
    .delete()
    .eq("user_id", userId)
    .eq("exercise_id", exerciseId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function personalizeGlobalExercise(exerciseId: string) {
  const supabase = await createClient();
  const userId = await getUserId();

  const { data: source, error: sourceError } = await supabase
    .from("exercises")
    .select("*")
    .eq("id", exerciseId)
    .eq("is_global", true)
    .is("archived_at", null)
    .maybeSingle();

  if (sourceError) {
    throw new Error(sourceError.message);
  }

  if (!source) {
    throw new Error("Solo se pueden personalizar ejercicios de la biblioteca base.");
  }

  const exercise = source as Exercise;
  const { data, error } = await supabase
    .from("exercises")
    .insert({
      user_id: userId,
      name: exercise.name,
      primary_muscle: exercise.primary_muscle,
      secondary_muscle: exercise.secondary_muscle,
      description: exercise.description,
      notes: exercise.notes,
      youtube_url: exercise.youtube_url,
      is_favorite: false,
      is_global: false,
      source_exercise_id: exercise.id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return { ...(data as Exercise), is_favorite: false };
}

export async function archiveExercise(exerciseId: string) {
  const supabase = await createClient();
  const userId = await getUserId();

  const { error } = await supabase
    .from("exercises")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", exerciseId)
    .eq("user_id", userId)
    .eq("is_global", false);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteExerciseIfUnused(exerciseId: string) {
  const supabase = await createClient();
  const userId = await getUserId();
  const exercise = await getExerciseById(exerciseId);

  if (!exercise || exercise.user_id !== userId || exercise.is_global) {
    throw new Error("Solo puedes eliminar ejercicios personales.");
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
    .eq("user_id", userId)
    .eq("is_global", false);

  if (error) {
    throw new Error(error.message);
  }
}
