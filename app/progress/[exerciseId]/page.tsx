import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    exerciseId: string;
  }>;
};

export default async function LegacyExerciseProgressPage({ params }: Props) {
  const { exerciseId } = await params;
  redirect(`/progress/exercise/${exerciseId}`);
}
