import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useAsync } from "@/lib/useAsync";
import { listMaterials } from "@/services/materials";
import { generateActivity, saveActivity } from "@/services/generate";
import { ACTIVITY_TYPES } from "@/lib/schemas";
import type { Activity } from "@/lib/schemas";
import { Spinner, EmptyState, useToast } from "@/components/ui";
import { printHtml, escapeHtml } from "@/features/curriculum/print";
import { useAuth } from "@/features/auth/AuthContext";

export default function Activities() {
  const toast = useToast();
  const { configured } = useAuth();
  const materials = useAsync(() => (configured ? listMaterials() : Promise.resolve([])), []);
  const [form, setForm] = useState({
    materialId: "", activityType: "game", durationMinutes: 30, groupSize: "Groups of 4",
    difficulty: "easy", objective: "", materialsAvailable: "",
  });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Activity | null>(null);

  async function gen() {
    if (!form.materialId) { toast("error", "Pick a chapter first."); return; }
    setBusy(true); setResult(null);
    try { setResult(await generateActivity(form)); }
    catch (err: any) { toast("error", err.message); }
    finally { setBusy(false); }
  }

  async function save() {
    if (!result) return;
    try { await saveActivity(result, form.materialId || null); toast("success", "Saved to your history"); }
    catch (err: any) { toast("error", err.message); }
  }

  function print() {
    if (!result) return;
    const sec = (t: string, items: string[]) => items.length ? `<h2>${t}</h2><ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>` : "";
    printHtml(result.title, `
      <div class="head"><h1>${escapeHtml(result.title)}</h1>
      <p class="muted">Class ${result.grade} · ${escapeHtml(result.subject)} · ${escapeHtml(result.topic)}</p></div>
      <p class="muted">${result.durationMinutes} min · ${escapeHtml(result.groupSize)} · ${result.difficulty}</p>
      ${sec("Learning objectives", result.learningObjectives)}
      ${sec("Materials", result.materials)}
      ${sec("Preparation", result.preparation)}
      <h2>Procedure</h2><ol>${result.steps.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ol>
      ${sec("Teacher instructions", result.teacherInstructions)}
      ${sec("Student rules", result.studentRules)}
      ${sec("Expected outcomes", result.expectedOutcomes)}
      ${sec("Assessment checklist", result.assessmentChecklist)}
      ${result.answerKey ? sec("Answer key", result.answerKey) : ""}
      ${sec("Adaptations", result.adaptations)}
      ${sec("Safety notes", result.safetyNotes)}
    `);
  }

  return (
    <>
      <PageHeader title="Activity generator" subtitle="Hands-on games, puzzles, experiments and more — grounded in your chapter." />
      {!configured && <EmptyState title="Connect Supabase to generate activities" />}

      {configured && (
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="card space-y-3 p-5">
            <div>
              <label className="label">Chapter</label>
              <select className="input" value={form.materialId} onChange={(e) => setForm({ ...form, materialId: e.target.value })}>
                <option value="">Select…</option>
                {materials.data?.map((m) => <option key={m.id} value={m.id}>{m.title}{m.chapter ? ` · ${m.chapter}` : ""}</option>)}
              </select>
              {!materials.data?.length && !materials.loading && <p className="mt-1 text-xs text-fg/50">No materials assigned yet.</p>}
            </div>
            <div>
              <label className="label">Activity type</label>
              <select className="input" value={form.activityType} onChange={(e) => setForm({ ...form, activityType: e.target.value })}>
                {ACTIVITY_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Duration (min)</label>
                <input className="input" type="number" min={5} max={180} value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })} /></div>
              <div><label className="label">Difficulty</label>
                <select className="input" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                  <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                </select></div>
            </div>
            <div><label className="label">Group size</label>
              <input className="input" value={form.groupSize} onChange={(e) => setForm({ ...form, groupSize: e.target.value })} /></div>
            <div><label className="label">Learning objective (optional)</label>
              <input className="input" value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} /></div>
            <div><label className="label">Materials available (optional)</label>
              <input className="input" value={form.materialsAvailable} onChange={(e) => setForm({ ...form, materialsAvailable: e.target.value })} placeholder="chart paper, leaves…" /></div>
            <button className="btn-primary w-full" onClick={gen} disabled={busy}>{busy ? <Spinner label="Generating…" /> : "Generate activity"}</button>
          </div>

          <div>
            {busy && <div className="card p-10"><Spinner label="Designing a classroom activity…" /></div>}
            {!busy && !result && <EmptyState title="Your activity will appear here" hint="Pick a chapter and options, then generate." />}
            {result && (
              <div className="card p-6">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold">{result.title}</h2>
                    <p className="text-sm text-fg/60">Class {result.grade} · {result.subject} · {result.durationMinutes} min · {result.groupSize}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-outline px-3 py-1.5" onClick={gen}>Regenerate</button>
                    <button className="btn-outline px-3 py-1.5" onClick={print}>Print</button>
                    <button className="btn-primary px-3 py-1.5" onClick={save}>Save</button>
                  </div>
                </div>
                <Section title="Learning objectives" items={result.learningObjectives} />
                <Section title="Materials" items={result.materials} />
                <div className="mt-3"><h3 className="font-semibold">Procedure</h3>
                  <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-fg/75">{result.steps.map((s, i) => <li key={i}>{s}</li>)}</ol></div>
                <Section title="Expected outcomes" items={result.expectedOutcomes} />
                <Section title="Assessment checklist" items={result.assessmentChecklist} />
                <Section title="Adaptations" items={result.adaptations} />
                <Section title="Safety notes" items={result.safetyNotes} />
                {result.citations.length > 0 && (
                  <p className="mt-4 border-t border-fg/10 pt-3 text-xs text-fg/50">
                    Curriculum source{result.citations.length > 1 ? "s" : ""}: {result.citations.map((c) => `p.${c.page ?? "?"}`).join(", ")}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-3">
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-fg/75">{items.map((i, k) => <li key={k}>{i}</li>)}</ul>
    </div>
  );
}
