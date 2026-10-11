import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useAsync } from "@/lib/useAsync";
import { listMaterials } from "@/services/materials";
import { generateQuiz, saveQuiz } from "@/services/generate";
import type { Quiz } from "@/lib/schemas";
import { Spinner, EmptyState, useToast } from "@/components/ui";
import { printHtml, escapeHtml } from "@/features/curriculum/print";
import { useAuth } from "@/features/auth/AuthContext";

const QTYPES = ["mcq", "true_false", "fill_blank", "short_answer"] as const;

export default function Quizzes() {
  const toast = useToast();
  const { configured } = useAuth();
  const materials = useAsync(() => (configured ? listMaterials() : Promise.resolve([])), []);
  const [form, setForm] = useState({ materialId: "", count: 5, difficulty: "easy", types: ["mcq", "true_false"] as string[] });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Quiz | null>(null);
  const [showKey, setShowKey] = useState(true);

  function toggleType(t: string) {
    setForm((f) => ({ ...f, types: f.types.includes(t) ? f.types.filter((x) => x !== t) : [...f.types, t] }));
  }

  async function gen() {
    if (!form.materialId) { toast("error", "Pick a chapter first."); return; }
    if (!form.types.length) { toast("error", "Choose at least one question type."); return; }
    setBusy(true); setResult(null);
    try { setResult(await generateQuiz(form)); }
    catch (err: any) { toast("error", err.message); }
    finally { setBusy(false); }
  }

  async function save() {
    if (!result) return;
    try { await saveQuiz(result, form.materialId || null); toast("success", "Saved to your history"); }
    catch (err: any) { toast("error", err.message); }
  }

  function print() {
    if (!result) return;
    const q = result.questions.map((x, i) => {
      const opts = x.options ? `<div class="opt">${x.options.map((o, j) => `${String.fromCharCode(65 + j)}. ${escapeHtml(o)}`).join("&nbsp;&nbsp;")}</div>` : "";
      const key = `<div class="muted">Answer: ${escapeHtml(x.answer)}${x.explanation ? ` — ${escapeHtml(x.explanation)}` : ""}</div>`;
      return `<div class="q"><b>${i + 1}.</b> ${escapeHtml(x.prompt)} <span class="muted">[${x.marks}]</span>${opts}${key}</div>`;
    }).join("");
    printHtml(result.title, `<div class="head"><h1>Royal School – CBSE</h1><p>${escapeHtml(result.title)}</p></div>
      <p class="muted">Class ${result.grade} · ${escapeHtml(result.subject)}</p><h2>Quiz & Answer Key</h2>${q}`);
  }

  return (
    <>
      <PageHeader title="Quiz generator" subtitle="Quick quizzes with marks, answer keys and explanations." />
      {!configured && <EmptyState title="Connect Supabase to generate quizzes" />}
      {configured && (
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="card space-y-3 p-5">
            <div><label className="label">Chapter</label>
              <select className="input" value={form.materialId} onChange={(e) => setForm({ ...form, materialId: e.target.value })}>
                <option value="">Select…</option>
                {materials.data?.map((m) => <option key={m.id} value={m.id}>{m.title}{m.chapter ? ` · ${m.chapter}` : ""}</option>)}
              </select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Questions</label>
                <input className="input" type="number" min={1} max={20} value={form.count} onChange={(e) => setForm({ ...form, count: Number(e.target.value) })} /></div>
              <div><label className="label">Difficulty</label>
                <select className="input" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                  <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                </select></div>
            </div>
            <div><label className="label">Question types</label>
              <div className="flex flex-wrap gap-2">
                {QTYPES.map((t) => (
                  <button key={t} type="button" onClick={() => toggleType(t)}
                    className={`chip ${form.types.includes(t) ? "bg-accent-soft text-accent" : ""}`}>{t.replace(/_/g, " ")}</button>
                ))}
              </div></div>
            <button className="btn-primary w-full" onClick={gen} disabled={busy}>{busy ? <Spinner label="Generating…" /> : "Generate quiz"}</button>
          </div>

          <div>
            {busy && <div className="card p-10"><Spinner label="Writing quiz…" /></div>}
            {!busy && !result && <EmptyState title="Your quiz will appear here" />}
            {result && (
              <div className="card p-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div><h2 className="text-xl font-bold">{result.title}</h2>
                    <p className="text-sm text-fg/60">Class {result.grade} · {result.subject} · {result.questions.length} questions</p></div>
                  <div className="flex gap-2">
                    <button className="btn-outline px-3 py-1.5" onClick={gen}>Regenerate</button>
                    <button className="btn-outline px-3 py-1.5" onClick={() => setShowKey((v) => !v)}>{showKey ? "Hide key" : "Show key"}</button>
                    <button className="btn-outline px-3 py-1.5" onClick={print}>Print</button>
                    <button className="btn-primary px-3 py-1.5" onClick={save}>Save</button>
                  </div>
                </div>
                <ol className="space-y-3">
                  {result.questions.map((q, i) => (
                    <li key={i} className="rounded-xl bg-surface p-4 text-sm">
                      <p className="font-medium">{i + 1}. {q.prompt} <span className="text-fg/40">[{q.marks}]</span></p>
                      {q.options && <p className="mt-1 text-fg/60">{q.options.map((o, j) => `${String.fromCharCode(65 + j)}. ${o}`).join("   ")}</p>}
                      {showKey && <p className="mt-2 text-xs font-medium text-accent">Answer: {q.answer}{q.explanation ? ` — ${q.explanation}` : ""}</p>}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
