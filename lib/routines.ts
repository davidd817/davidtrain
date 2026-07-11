import { supabase } from "@/lib/supabase";
import { DEV_USER_ID } from "@/lib/config";

export type Routine = {
  id: string;
  name: string;
  description: string | null;
};

export async function getRoutines(): Promise<Routine[]> {

  const { data, error } = await supabase
    .from("workout_routines")
    .select("*")
    .eq("user_id", DEV_USER_ID)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createRoutine(
  name: string,
  description?: string
) {

  const { data, error } = await supabase
    .from("workout_routines")
    .insert({
      user_id: DEV_USER_ID,
      name,
      description: description || null
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}