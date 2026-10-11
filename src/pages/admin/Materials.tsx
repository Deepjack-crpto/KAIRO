import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useAsync } from "@/lib/useAsync";
import { listClasses, listSubjects } from "@/services/catalog";
import { listMaterials, uploadMaterial, setPublished, retryProcessing, archiveMaterial, validateFile } from "@/services/materials";
import { EmptyState, Skeleton, StatusBadge, useToast, ConfirmDialog } from "@/components/ui";

export default function Materials() {
  const toast = useToast();
  const materials = useAsync(() => listMaterials(), []);
  const classes = useAsync(() => listClasses(), []);
  const subjects = useAsync(() => listSubjects(), []);
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState({ title: "", classId: "", subjectId: "", chapter: "", academicYear: "2025-2026" });
  const [busy, setBusy] = useState(false);
  const [archiveId, setArchiveId] = useState<string | null>(null);

  async function doUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { toast("error", "Choose a file."); return; }
    const fe = validateFile(file);
    if (fe) { toast("error", fe); return; }
    if (!meta.title || !meta.classId || !meta.subjectId) { toast("error", "Title, class and subject are required."); return; }
    setBusy(true);
    try {
      await uploadMaterial(file, { ...meta, sectionId: null });
      toast("success", "Uploaded — processing started.");
      setFile(null); setMeta({ ...meta, title: "", chapter: "" });
      materials.reload();
    } catch (err: any) { toast("error", err.message); }
    finally { setBusy(false); }
  }

  return (
    <>
      <PageHeader title="Curriculum" subtitle="Upload, process and publish approved materials. Teachers only see ready + published items." />

      <form onSubmit={doUpload} className="card mb-6 grid gap-3 p-5 md:grid-cols-2">
        <input className="input" placeholder="Title (e.g. Plants Around Us)" value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} />
        <input className="input" placeholder="Chapter (optional)" value={meta.chapter} onChange={(e) => setMeta({ ...meta, chapter: e.target.value })} />
        <select className="input" value={meta.classId} onChange={(e) => setMeta({ ...meta, classId: e.target.value })}>
          <option value="">Class…</option>
          {classes.data?.map((c) => <option key={c.id} value={c.id}>Class {c.grade}</option>)}
        </select>
        <select className="input" value={meta.subjectId} onChange={(e) => setMeta({ ...meta, subjectId: e.target.value })}>
          <option value="">Subject…</option>
          {subjects.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input className="input md:col-span-2" type="file" accept=".pdf,.docx,.pptx,.txt"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <div className="md:col-span-2">
          <button className="btn-primary" disabled={busy}>{busy ? "Uploading…" : "Upload & process"}</button>
          <span className="ml-3 text-xs text-fg/50">PDF, DOCX, PPTX, TXT · max 25 MB</span>
        </div>
      </form>

      {materials.error && <p className="mb-4 text-sm text-accent">{materials.error}</p>}
      {materials.loading ? <Skeleton className="h-40" /> :
        !materials.data?.length ? <EmptyState title="No materials yet" hint="Upload a chapter above to get started." /> : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left text-fg/60">
                <tr><th className="p-3">Title</th><th className="p-3">Status</th><th className="p-3">Published</th><th className="p-3 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-fg/5">
                {materials.data.map((m) => (
                  <tr key={m.id}>
                    <td className="p-3">
                      <div className="font-medium">{m.title}</div>
                      <div className="text-xs text-fg/50">{m.chapter || "—"} · {(m.byte_size / 1e6).toFixed(1)} MB</div>
                      {m.error_message && <div className="text-xs text-accent">{m.error_message}</div>}
                    </td>
                    <td className="p-3"><StatusBadge status={m.status} /></td>
                    <td className="p-3">{m.is_published ? <StatusBadge status="active" /> : <span className="chip">draft</span>}</td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        {m.status === "failed" && <button className="btn-outline px-3 py-1.5" onClick={() => retryProcessing(m.id).then(materials.reload).catch((e) => toast("error", e.message))}>Retry</button>}
                        {m.status === "ready" && (
                          <button className="btn-outline px-3 py-1.5"
                            onClick={() => setPublished(m.id, !m.is_published).then(() => { toast("success", m.is_published ? "Unpublished" : "Published"); materials.reload(); }).catch((e) => toast("error", e.message))}>
                            {m.is_published ? "Unpublish" : "Publish"}
                          </button>
                        )}
                        <button className="btn-ghost px-3 py-1.5" onClick={() => setArchiveId(m.id)}>Archive</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      <ConfirmDialog open={!!archiveId} danger title="Archive material?"
        body="It will be unpublished and hidden from teachers. This can be re-uploaded later."
        confirmLabel="Archive"
        onCancel={() => setArchiveId(null)}
        onConfirm={() => { if (archiveId) archiveMaterial(archiveId).then(() => { toast("success", "Archived"); materials.reload(); }).catch((e) => toast("error", e.message)); setArchiveId(null); }}
      />
    </>
  );
}
