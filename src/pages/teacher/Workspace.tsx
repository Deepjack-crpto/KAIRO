import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { requireSupabase } from "@/lib/supabase";
import { useAsync } from "@/lib/useAsync";
import { askQuestion } from "@/services/generate";
import { Spinner, EmptyState, useToast } from "@/components/ui";
import { useAuth } from "@/features/auth/AuthContext";
import type { AiAnswer } from "@/lib/schemas";
import type { Material } from "@/types/db";

const suggested = [
  "Explain the main idea in simple words for this class.",
  "Give me three real-world examples children will understand.",
  "What are the key points to summarise at the end?",
];

export default function Workspace() {
  const { materialId } = useParams();
  const toast = useToast();
  const { configured } = useAuth();

  const material = useAsync<Material | null>(async () => {
    if (!configured || !materialId) return null;
    const { data, error } = await requireSupabase()
      .from("curriculum_materials").select("*").eq("id", materialId).maybeSingle();
    if (error) throw error;
    return data as Material | null;
  }, [materialId]);

  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [thread, setThread] = useState<{ q: string; a: AiAnswer }[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>();

  async function ask(q: string) {
    if (!q.trim() || !materialId) return;
    setBusy(true);
    try {
      const res = await askQuestion(materialId, q, sessionId);
      setSessionId(res.sessionId);
      setThread((t) => [...t, { q, a: res }]);
      setQuestion("");
    } catch (err: any) {
      toast("error", err.message);
    } finally { setBusy(false); }
  }

  if (!configured)
    return <EmptyState title="Connect Supabase to use the workspace" hint="The AI workspace needs a configured backend." />;
  if (material.loading) return <Spinner label="Opening workspace…" />;
  if (!material.data)
    return <EmptyState title="Material not available"
      hint="It may be unpublished or outside your assignments." action={<Link to="/teacher/materials" className="btn-outline mt-2">Back to materials</Link>} />;

  return (
    <div className="grid h-[calc(100vh-7rem)] gap-5 lg:grid-cols-2">
      {/* Left: chapter */}
      <div className="card flex flex-col overflow-hidden">
        <div className="border-b border-fg/5 p-4">
          <Link to="/teacher/materials" className="text-xs text-fg/50 hover:text-accent">← Materials</Link>
          <h1 className="mt-1 text-lg font-bold">{material.data.title}</h1>
          <p className="text-sm text-fg/60">{material.data.chapter}</p>
        </div>
        <div className="flex-1 overflow-auto p-4 text-sm text-fg/75">
          <p className="rounded-xl bg-surface p-4">
            Chapter content and page references appear here once the document is processed.
            KAIRO retrieves the most relevant passages from this material when you ask a question,
            and cites the exact page.
          </p>
        </div>
      </div>

      {/* Right: Ask KAIRO */}
      <div className="card flex flex-col overflow-hidden">
        <div className="border-b border-fg/5 p-4"><h2 className="font-semibold">Ask KAIRO</h2></div>
        <div className="flex-1 space-y-4 overflow-auto p-4">
          {thread.length === 0 && (
            <div>
              <p className="text-sm text-fg/50">Try asking:</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {suggested.map((s) => (
                  <button key={s} className="chip hover:bg-accent-soft hover:text-accent" onClick={() => ask(s)}>{s}</button>
                ))}
              </div>
            </div>
          )}
          {thread.map((m, i) => (
            <div key={i} className="space-y-2">
              <p className="rounded-xl bg-accent-soft p-3 text-sm font-medium text-accent">{m.q}</p>
              {!m.a.grounded ? (
                <p className="rounded-xl bg-surface p-3 text-sm text-fg/70">
                  The uploaded material does not provide enough information to answer this confidently.
                </p>
              ) : (
                <div className="rounded-xl bg-surface p-3 text-sm">
                  <p className="text-fg/80">{m.a.answer}</p>
                  {m.a.teachingSuggestions.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-semibold text-fg/60">Teaching suggestions (not from the textbook)</p>
                      <ul className="mt-1 list-disc pl-5 text-fg/70">{m.a.teachingSuggestions.map((s, j) => <li key={j}>{s}</li>)}</ul>
                    </div>
                  )}
                  {m.a.citations.length > 0 && (
                    <div className="mt-2 border-t border-fg/10 pt-2 text-xs text-fg/50">
                      {m.a.citations.map((c, j) => <p key={j}>Source · p.{c.page ?? "?"} — “{c.quote}”</p>)}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {busy && <Spinner label="KAIRO is reading the chapter…" />}
        </div>
        <form className="border-t border-fg/5 p-3" onSubmit={(e) => { e.preventDefault(); ask(question); }}>
          <div className="flex gap-2">
            <input className="input" placeholder="How do I explain… to this class?" value={question} onChange={(e) => setQuestion(e.target.value)} disabled={busy} />
            <button className="btn-primary" disabled={busy || !question.trim()}>Ask</button>
          </div>
        </form>
      </div>
    </div>
  );
}
