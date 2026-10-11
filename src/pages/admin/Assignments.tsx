import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useAsync } from "@/lib/useAsync";
import {
  listAssignments, listTeachers, listClasses, listSections, listSubjects,
  createAssignment, setAssignmentRevoked,
} from "@/services/catalog";
import { assignmentSchema } from "@/lib/schemas";
import { EmptyState, Skeleton, useToast, StatusBadge } from "@/components/ui";

export default function Assignments() {
  const toast = useToast();
  const assignments = useAsync(() => listAssignments(), []);
  const teachers = useAsync(() => listTeachers(), []);
  const classes = useAsync(() => listClasses(), []);
  const sections = useAsync(() => listSections(), []);
  const subjects = useAsync(() => listSubjects(), []);
  const [form, setForm] = useState({ teacherId: "", classId: "", sectionId: "", subjectId: "" });

  const sectionOpts = sections.data?.filter((s) => s.class_id === form.classId) ?? [];

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const parsed = assignmentSchema.safeParse(form);
    if (!parsed.success) { toast("error", "Select teacher, class, section and subject."); return; }
    try {
      await createAssignment(parsed.data);
      toast("success", "Assignment created");
      setForm({ teacherId: "", classId: "", sectionId: "", subjectId: "" });
      assignments.reload();
    } catch (err: any) {
      toast("error", err.message.includes("duplicate") ? "That assignment already exists." : err.message);
    }
  }

  const label = (a: { teacher_id: string; class_id: string; section_id: string; subject_id: string }) => {
    const t = teachers.data?.find((x) => x.id === a.teacher_id);
    const c = classes.data?.find((x) => x.id === a.class_id);
    const s = sections.data?.find((x) => x.id === a.section_id);
    const sub = subjects.data?.find((x) => x.id === a.subject_id);
    return `${t?.full_name || t?.email || "?"} → Class ${c?.grade ?? "?"}${s ? ` ${s.name}` : ""} · ${sub?.name ?? "?"}`;
  };

  return (
    <>
      <PageHeader title="Assignments" subtitle="Assignments control which materials and AI features each teacher can access." />

      <form onSubmit={add} className="card mb-6 grid gap-3 p-5 md:grid-cols-5">
        <select className="input" value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })}>
          <option value="">Teacher…</option>
          {teachers.data?.map((t) => <option key={t.id} value={t.id}>{t.full_name || t.email}</option>)}
        </select>
        <select className="input" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value, sectionId: "" })}>
          <option value="">Class…</option>
          {classes.data?.map((c) => <option key={c.id} value={c.id}>Class {c.grade}</option>)}
        </select>
        <select className="input" value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })} disabled={!form.classId}>
          <option value="">Section…</option>
          {sectionOpts.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="input" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
          <option value="">Subject…</option>
          {subjects.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button className="btn-primary">Assign</button>
      </form>

      {assignments.loading ? <Skeleton className="h-40" /> :
        !assignments.data?.length ? <EmptyState title="No assignments yet" hint="Create one above to grant a teacher access to a subject." /> : (
          <div className="card divide-y divide-fg/5">
            {assignments.data.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className={a.is_revoked ? "text-fg/40 line-through" : ""}>{label(a)}</span>
                <div className="flex items-center gap-2">
                  {a.is_revoked && <StatusBadge status="archived" />}
                  <button className="btn-outline px-3 py-1.5"
                    onClick={() => setAssignmentRevoked(a.id, !a.is_revoked).then(() => { toast("success", "Updated"); assignments.reload(); }).catch((e) => toast("error", e.message))}>
                    {a.is_revoked ? "Restore" : "Revoke"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
    </>
  );
}
