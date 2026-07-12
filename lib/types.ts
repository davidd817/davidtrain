export type Exercise = {
  id: string;
  created_at: string;
  user_id: string;
  name: string;
  primary_muscle: string | null;
  secondary_muscle: string | null;
  description: string | null;
  notes: string | null;
  youtube_url: string | null;
  is_favorite: boolean;
  archived_at?: string | null;
  is_global?: boolean;
  source_exercise_id?: string | null;
};

export type Routine = {
  id: string;
  created_at?: string;
  user_id: string;
  name: string;
  description: string | null;
  archived_at?: string | null;
};

export type WorkoutDay = {
  id: string;
  routine_id: string;
  name: string;
  order_index: number;
  archived_at?: string | null;
};

export type PlannedExercise = {
  id: string;
  day_id: string;
  exercise_id: string;
  sets: number | null;
  reps_min: number | null;
  reps_max: number | null;
  rir: number | null;
  rest_seconds: number | null;
  notes: string | null;
  order_index: number | null;
  archived_at?: string | null;
  exercises: Pick<
    Exercise,
    "id" | "name" | "primary_muscle" | "secondary_muscle" | "notes" | "is_global"
  > | null;
};

export type WorkoutSession = {
  id: string;
  user_id: string;
  routine_id: string | null;
  day_id: string | null;
  started_at: string;
  completed_at: string | null;
  duration_seconds?: number | null;
  completed_day_advanced_at?: string | null;
};

export type ExerciseLog = {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  weight: number;
  reps: number;
  rir: number;
  created_at: string;
};
