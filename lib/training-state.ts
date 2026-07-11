import { supabase } from "@/lib/supabase";
import { DEV_USER_ID } from "@/lib/config";

export type TrainingState = {
  user_id: string;
  active_routine_id: string | null;
  next_day_index: number;
};

export async function getTrainingState(): Promise<TrainingState | null> {
  const { data, error } = await supabase
    .from("user_training_state")
    .select("*")
    .eq("user_id", DEV_USER_ID)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function setActiveRoutine(routineId: string) {
  const { error } = await supabase
    .from("user_training_state")
    .upsert({
      user_id: DEV_USER_ID,
      active_routine_id: routineId,
      next_day_index: 0,
    });

  if (error) {
    throw new Error(error.message);
  }
}