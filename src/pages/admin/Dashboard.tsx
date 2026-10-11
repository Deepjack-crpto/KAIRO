import type { ReactNode } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useAsync } from "@/lib/useAsync";
import { adminMetrics, listAudit } from "@/services/admin";
import { Skeleton, EmptyState } from "@/components/ui";
import { useAuth } from "@/features/auth/AuthContext";

type Tone = "accent" | "green" | "sky" | "amber";

const TONES: Record<Tone, { bg: string; icon: string; value: string }> = {
  accent: { bg: "bg-accent-soft", icon: "bg-accent text-white", value: "text-accent" },
  green: { bg: "bg-green-50", icon: "bg-green-600 text-white", value: "text-green-700" },
  sky: { bg: "bg-sky-50", icon: "bg-sky-600 text-white", value: "text-sky-700" },
  amber: { bg: "bg-amber-50", icon: "bg-amber-500 text-white", value: "text-amber-700" },
};

/** Headline metric: tinted card with an icon badge. */
function StatCard({ label, value, icon, tone }: { label: string; value: number; icon: ReactNode; tone: Tone }) {
  const t = TONES[tone];
  return (
    <div className={`card flex items-center justify-between p-5 ${t.bg}`}>
      <div>
        <p className={`text-3xl font-extrabold ${t.value}`}>{value}</p>
        <p className="mt-1 text-sm font-medium text-fg/70">{label}</p>
      </div>
      <span aria-hidden className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg ${t.icon}`}>
        {icon}
      </span>
    </div>
  );
}

/** Secondary metric: compact row inside the Quick Overview card. */
function Mini({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-surface px-4 py-3">
      <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-lg bg-card text-fg/70">{icon}</span>
      <div>
        <p className="text-xl font-bold leading-none">{value}</p>
        <p className="mt-1 text-xs text-fg/60">{label}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { configured } = useAuth();
  const metrics = useAsync(() => adminMetrics(), []);
  const audit = useAsync(() => listAudit(8), []);

  if (!configured)
    return (
      <>
        <PageHeader title="Dashboard" />
        <EmptyState
          title="Connect Supabase to see live metrics"
          hint="Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, run the migrations, then provision the first admin."
        />
      </>
    );

  const m = metrics.data;

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Live, database-backed metrics." />
      {metrics.error && <p className="mb-4 text-sm text-accent">{metrics.error}</p>}

      {/* Headline stat cards */}
      {metrics.loading || !m ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Teachers" value={m.teachers} icon="☺" tone="accent" />
          <StatCard label="Active accounts" value={m.active} icon="✓" tone="green" />
          <StatCard label="Classes" value={m.classes} icon="▤" tone="sky" />
          <StatCard label="Published materials" value={m.materialsPublished} icon="▣" tone="amber" />
        </div>
      )}

      {/* Quick Overview + Recent Activity */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold">Quick overview</h2>
          {metrics.loading || !m ? (
            <Skeleton className="h-48" />
          ) : (
            <div className="card p-5">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <Mini label="Sections" value={m.sections} icon="▦" />
                <Mini label="Live assignments" value={m.assignments} icon="⇄" />
                <Mini label="Processing" value={m.processing} icon="↻" />
                <Mini label="Activities" value={m.activities} icon="✦" />
                <Mini label="Worksheets" value={m.worksheets} icon="✎" />
                <Mini label="Quizzes" value={m.quizzes} icon="✓" />
                <Mini label="Suspended accounts" value={m.suspended} icon="⏻" />
              </div>
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Recent activity</h2>
          {audit.loading ? (
            <Skeleton className="h-48" />
          ) : !audit.data?.length ? (
            <EmptyState
              title="No administrative events yet"
              hint="Teacher invitations, status changes and publishing actions will appear here."
            />
          ) : (
            <div className="card divide-y divide-fg/5">
              {audit.data.map((a) => (
                <div key={a.id} className="px-5 py-3 text-sm">
                  <p className="font-medium">
                    {a.action}
                    {a.target ? <span className="font-normal text-fg/60"> · {a.target}</span> : null}
                  </p>
                  <p className="mt-0.5 text-xs text-fg/50">{new Date(a.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
