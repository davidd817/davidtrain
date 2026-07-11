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
};