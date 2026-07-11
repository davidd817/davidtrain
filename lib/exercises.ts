import { supabase } from "@/lib/supabase";
import { DEV_USER_ID } from "@/lib/config";
import type { Exercise } from "@/lib/types";

export type CreateExerciseInput = {
  name: string;
  primary_muscle?: string;
  secondary_muscle?: string;
  description?: string;
  notes?: string;
  youtube_url?: string;
  is_favorite?: boolean;
};

export async function getExercises(): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("user_id", DEV_USER_ID)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createExercise(input: CreateExerciseInput) {
  const { data, error } = await supabase
    .from("exercises")
    .insert({
      user_id: DEV_USER_ID,
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

  return data;
}