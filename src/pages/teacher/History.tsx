import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useAsync } from "@/lib/useAsync";
import { listHistory, deleteHistory } from "@/services/generate";
import { EmptyState, Skeleton, useToast, ConfirmDialog } from "@/components/ui";
import { useAuth } from "@/features/auth/AuthContext";
import type { HistoryRow } from "@/types/db";

const TYPES = ["", "activity", "worksheet", "quiz", "explanation", "summary", "lesson_plan"];

export default function History() {
  const toast = useToast();
  const { configured } = useAuth();
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const { data, loading, reload } = useAsync(
    () => (configured ? listHistory({ type: type || undefined, search: search || undefined }) : Promise.resolve([])),
    [type, search],
  );
  const [del, setDel] = useState<HistoryRow | null>(null);
  const [open, setOpen] = useState<HistoryRow | null>(null);

  async function doDelete() {
    if (!del) return;
    try { await deleteHistory(del.id); toast("success", "Deleted"); reload(); }
    catch (err: any) { toast("error", err.message); }
    finally { setDel(null); }
  }

  return (
    <>
      <PageHeader title="History & saved library" subtitle="Everything you've generated, private to you." />
      {!configured && <EmptyState title="Connect Supabase to view your history" />}

      {configured && (
        <>
          <div className="mb-5 flex flex-wrap gap-3">
            <input className="input max-w-xs" placeholder="Search titles…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="input max-w-xs" value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map((t) => <option key={t} value={t}>{t ? t.replace(/_/g, " ") : "All types"}</option>)}
            </select>
          </div>

          {loading ? <Skeleton className="h-40" /> :
            !data?.length ? <EmptyState title="No saved resources yet" hint="Generate and save an activity, worksheet or quiz." /> : (
              <div className="card divide-y divide-fg/5">
                {data.map((h) => (
                  <div key={h.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                    <div className="min-w-0">
                      <span className="chip mr-2">{h.resource_type}</span>
                      <span className="font-medium">{h.title}</span>
                      <span className="ml-2 text-fg/40">{h.summary}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-fg/40">{new Date(h.created_at).toLocaleDateString()}</span>
                      <button className="btn-ghost px-3 py-1.5" onClick={() => setOpen(h)}>Open</button>
                      <button className="btn-ghost px-3 py-1.5 text-accent" onClick={() => setDel(h)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </>
      )}

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-fg/40 p-4" onClick={() => setOpen(null)}>
          <div className="card max-h-[80vh] w-full max-w-2xl overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">{open.title}</h2>
            <p className="mt-1 text-sm text-fg/60">{open.resource_type} · {new Date(open.created_at).toLocaleString()}</p>
            <pre className="mt-4 overflow-auto rounded-xl bg-surface p-4 text-xs">{JSON.stringify(open.payload, null, 2)}</pre>
            <button className="btn-outline mt-4" onClick={() => setOpen(null)}>Close</button>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!del} danger title="Delete resource?" body={del?.title}
        confirmLabel="Delete" onCancel={() => setDel(null)} onConfirm={doDelete} />
    </>
  );
}
