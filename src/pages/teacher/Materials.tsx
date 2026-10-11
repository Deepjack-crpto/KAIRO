import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { useAsync } from "@/lib/useAsync";
import { listMaterials } from "@/services/materials";
import { listClasses, listSubjects } from "@/services/catalog";
import { EmptyState, Skeleton } from "@/components/ui";

export default function Materials() {
  const materials = useAsync(() => listMaterials(), []);
  const classes = useAsync(() => listClasses(), []);
  const subjects = useAsync(() => listSubjects(), []);
  const [search, setSearch] = useState("");
  const [subj, setSubj] = useState("");

  // RLS already restricts to authorized, ready + published materials.
  const filtered = useMemo(() => {
    return (materials.data ?? []).filter((m) =>
      (!subj || m.subject_id === subj) &&
      (!search || m.title.toLowerCase().includes(search.toLowerCase()) || m.chapter.toLowerCase().includes(search.toLowerCase())),
    );
  }, [materials.data, subj, search]);

  return (
    <>
      <PageHeader title="My materials" subtitle="Only materials for your assigned classes and subjects." />

      <div className="mb-5 flex flex-wrap gap-3">
        <input className="input max-w-xs" placeholder="Search title or chapter…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input max-w-xs" value={subj} onChange={(e) => setSubj(e.target.value)}>
          <option value="">All subjects</option>
          {subjects.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {materials.error && <p className="mb-4 text-sm text-accent">{materials.error}</p>}
      {materials.loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
      ) : !filtered.length ? (
        <EmptyState title="No materials to show"
          hint="When your administrator publishes materials for your assignments, they'll appear here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => {
            const c = classes.data?.find((x) => x.id === m.class_id);
            const s = subjects.data?.find((x) => x.id === m.subject_id);
            return (
              <Link key={m.id} to={`/teacher/workspace/${m.id}`} className="card p-5 transition hover:border-accent/40">
                <div className="mb-2 flex gap-2">
                  <span className="chip">Class {c?.grade ?? "?"}</span>
                  <span className="chip">{s?.name ?? "?"}</span>
                </div>
                <h3 className="font-semibold">{m.title}</h3>
                <p className="mt-1 text-sm text-fg/60">{m.chapter || "Full material"}</p>
                <p className="mt-4 text-sm font-medium text-accent">Open workspace →</p>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
