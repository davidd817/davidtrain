import { supabase } from "@/lib/supabase";

export type WorkoutDay = {
  id: string;
  routine_id: string;
  name: string;
  order_index: number;
};

export async function getDaysByRoutine(
  routineId: string
): Promise<WorkoutDay[]> {
  const { data, error } = await supabase
    .from("workout_days")
    .select("*")
    .eq("routine_id", routineId)
    .order("order_index", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createWorkoutDay({
  routineId,
  name,
  orderIndex,
}: {
  routineId: string;
  name: string;
  orderIndex: number;
}) {
  const { data, error } = await supabase
    .from("workout_days")
    .insert({
      routine_id: routineId,
      name,
      order_index: orderIndex,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}