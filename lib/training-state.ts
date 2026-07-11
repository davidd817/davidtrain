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

  return data as TrainingState | null;
}

export async function setActiveRoutine({
  routineId,
  nextDayIndex = 0,
}: {
  routineId: string;
  nextDayIndex?: number;
}) {
  const { error } = await supabase.from("user_training_state").upsert(
    {
      user_id: DEV_USER_ID,
      active_routine_id: routineId,
      next_day_index: nextDayIndex,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function clearActiveRoutine() {
  const { error } = await supabase
    .from("user_training_state")
    .update({
      active_routine_id: null,
      next_day_index: 0,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", DEV_USER_ID);

  if (error) {
    throw new Error(error.message);
  }
}
