import { AppShell } from "@/components/layout/app-shell";
import { ProgressDashboardClient } from "@/components/progress/progress-dashboard-client";
import { getProgressOverview, getProgressSummaries } from "@/lib/progress";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const [overview, exercises] = await Promise.all([
    getProgressOverview(),
    getProgressSummaries(),
  ]);

  return (
    <AppShell>
      <header className="mb-5">
        <p className="text-sm font-medium text-slate-500">Historial y PRs</p>
        <h1 className="text-3xl font-bold tracking-tight">Progreso</h1>
      </header>

      <ProgressDashboardClient overview={overview} exercises={exercises} />
    </AppShell>
  );
}
