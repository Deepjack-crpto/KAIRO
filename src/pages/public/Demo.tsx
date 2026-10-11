import { useState } from "react";
import { Link } from "react-router-dom";
import { DEMO_CHAPTER, DEMO_ANSWER, DEMO_ACTIVITY, DEMO_WORKSHEET } from "@/features/curriculum/sampleData";

const tabs = ["Ask KAIRO", "Activity", "Worksheet"] as const;

export default function Demo() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Ask KAIRO");
  const [asked, setAsked] = useState(false);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <span className="chip">Demo data only</span>
          <h1 className="mt-2 text-2xl font-bold">
            Class {DEMO_CHAPTER.class} · {DEMO_CHAPTER.subject} · {DEMO_CHAPTER.chapter}
          </h1>
        </div>
        <Link to="/login" className="btn-outline">Sign in for the real thing</Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="card p-5">
          <h2 className="font-semibold">Sample chapter</h2>
          {DEMO_CHAPTER.passages.map((p) => (
            <p key={p.page} className="mt-3 rounded-xl bg-surface p-3 text-sm text-fg/75">
              <span className="chip mr-2">p.{p.page}</span>{p.text}
            </p>
          ))}
        </div>

        <div className="card p-5">
          <div className="mb-4 flex gap-1 rounded-xl bg-surface p-1">
            {tabs.map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium ${tab === t ? "bg-card shadow-sm text-accent" : "text-fg/60"}`}>
                {t}
              </button>
            ))}
          </div>

          {tab === "Ask KAIRO" && (
            <div>
              <p className="rounded-xl bg-accent-soft p-3 text-sm font-medium text-accent">
                “How do I explain leaf veins to Class 3?”
              </p>
              {!asked ? (
                <button className="btn-primary mt-4" onClick={() => setAsked(true)}>Ask KAIRO</button>
              ) : (
                <div className="mt-4 space-y-3 text-sm">
                  <p className="text-fg/80">{DEMO_ANSWER.answer}</p>
                  <div>
                    <p className="font-semibold">Teaching suggestions</p>
                    <ul className="mt-1 list-disc pl-5 text-fg/70">
                      {DEMO_ANSWER.teachingSuggestions.map((s) => <li key={s}>{s}</li>)}
                    </ul>
                  </div>
                  <p className="text-xs text-fg/50">Source: page {DEMO_ANSWER.citations[0].page} — “{DEMO_ANSWER.citations[0].quote}”</p>
                </div>
              )}
            </div>
          )}

          {tab === "Activity" && (
            <div className="space-y-3 text-sm">
              <h3 className="font-semibold">{DEMO_ACTIVITY.title}</h3>
              <p className="text-fg/60">{DEMO_ACTIVITY.durationMinutes} min · {DEMO_ACTIVITY.groupSize} · {DEMO_ACTIVITY.difficulty}</p>
              <ol className="list-decimal space-y-1 pl-5 text-fg/75">
                {DEMO_ACTIVITY.steps.map((s) => <li key={s}>{s}</li>)}
              </ol>
            </div>
          )}

          {tab === "Worksheet" && (
            <div className="space-y-3 text-sm">
              <h3 className="font-semibold">{DEMO_WORKSHEET.title}</h3>
              {DEMO_WORKSHEET.questions.map((q, i) => (
                <div key={i} className="rounded-xl bg-surface p-3">
                  <p className="font-medium">{i + 1}. {q.prompt}</p>
                  {q.options && <p className="mt-1 text-fg/60">{q.options.join(" · ")}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
