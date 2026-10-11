import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useAsync } from "@/lib/useAsync";
import { listClasses, listSections, createClass, createSection, setClassArchived } from "@/services/catalog";
import { classSchema, sectionSchema } from "@/lib/schemas";
import { Skeleton, useToast, StatusBadge } from "@/components/ui";

export default function Classes() {
  const toast = useToast();
  const classes = useAsync(() => listClasses(), []);
  const sections = useAsync(() => listSections(), []);
  const [grade, setGrade] = useState(1);
  const [year, setYear] = useState("2025-2026");
  const [secClass, setSecClass] = useState("");
  const [secName, setSecName] = useState("");

  async function addClass(e: React.FormEvent) {
    e.preventDefault();
    const parsed = classSchema.safeParse({ grade, academicYear: year });
    if (!parsed.success) { toast("error", parsed.error.issues[0].message); return; }
    try { await createClass(parsed.data.grade, parsed.data.academicYear); toast("success", "Class created"); classes.reload(); }
    catch (err: any) { toast("error", err.message); }
  }

  async function addSection(e: React.FormEvent) {
    e.preventDefault();
    const parsed = sectionSchema.safeParse({ classId: secClass, name: secName });
    if (!parsed.success) { toast("error", parsed.error.issues[0].message); return; }
    try { await createSection(parsed.data.classId, parsed.data.name); toast("success", "Section added"); setSecName(""); sections.reload(); }
    catch (err: any) { toast("error", err.message); }
  }

  return (
    <>
      <PageHeader title="Classes & Sections" subtitle="Classes are restricted to grades 1–5 (enforced in the database)." />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-3 font-semibold">Add class</h2>
          <form onSubmit={addClass} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <select className="input" value={grade} onChange={(e) => setGrade(Number(e.target.value))}>
              {[1, 2, 3, 4, 5].map((g) => <option key={g} value={g}>Class {g}</option>)}
            </select>
            <input className="input" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2025-2026" />
            <button className="btn-primary">Add</button>
          </form>
          <div className="mt-4 space-y-2">
            {classes.loading ? <Skeleton className="h-20" /> :
              !classes.data?.length ? <p className="text-sm text-fg/50">No classes yet.</p> :
              classes.data.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-xl bg-surface px-4 py-2.5 text-sm">
                  <span className="font-medium">Class {c.grade} <span className="text-fg/50">· {c.academic_year}</span></span>
                  <div className="flex items-center gap-2">
                    {c.is_archived && <StatusBadge status="archived" />}
                    <button className="btn-ghost px-2 py-1 text-xs" onClick={() => setClassArchived(c.id, !c.is_archived).then(classes.reload)}>
                      {c.is_archived ? "Unarchive" : "Archive"}
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="mb-3 font-semibold">Add section</h2>
          <form onSubmit={addSection} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <select className="input" value={secClass} onChange={(e) => setSecClass(e.target.value)} required>
              <option value="">Select class…</option>
              {classes.data?.map((c) => <option key={c.id} value={c.id}>Class {c.grade} ({c.academic_year})</option>)}
            </select>
            <input className="input" value={secName} onChange={(e) => setSecName(e.target.value)} placeholder="A" />
            <button className="btn-primary">Add</button>
          </form>
          <div className="mt-4 space-y-2">
            {sections.loading ? <Skeleton className="h-20" /> :
              !sections.data?.length ? <p className="text-sm text-fg/50">No sections yet.</p> :
              sections.data.map((s) => {
                const cls = classes.data?.find((c) => c.id === s.class_id);
                return (
                  <div key={s.id} className="rounded-xl bg-surface px-4 py-2.5 text-sm">
                    {cls ? `Class ${cls.grade}` : "Class"} · Section {s.name}
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </>
  );
}
