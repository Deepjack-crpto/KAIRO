import { Link } from "react-router-dom";
import { useTenant } from "@/lib/tenant";

const platformFeatures = [
  {
    icon: "🏢",
    title: "Subdomain Tenant Isolation",
    body: "Every school operates within an isolated subdomain (e.g. royal.kairo.com) backed by strict database-level RLS policies.",
  },
  {
    icon: "🧠",
    title: "Teacher-First Learning & AI",
    body: "Designed exclusively for teacher professional development, lesson preparation, and CBSE curriculum grounding.",
  },
  {
    icon: "⭐",
    title: "Teacher Admin & Delegations",
    body: "Structured elevation requests, granular privilege toggles, and principal review workflows.",
  },
  {
    icon: "🔒",
    title: "Defense-in-Depth Security",
    body: "Optional biometric face identity verification, private document storage, and tamper-resistant school audit logging.",
  },
];

const steps = [
  { n: 1, t: "School Provisioning", d: "Super Admin creates the school tenant and provisions the initial Principal environment." },
  { n: 2, t: "Curriculum Grounding", d: "School uploads approved CBSE textbooks and assigns teaching staff to classes and subjects." },
  { n: 3, t: "AI Assisted Teaching", d: "Teachers prepare lessons, generate worksheets, and explore pedagogical strategies." },
];

export default function Landing() {
  const { school, isMainDomain } = useTenant();

  return (
    <div>
      {/* Hero section */}
      <section className="mx-auto max-w-6xl px-4 pt-16 pb-12 text-center sm:pt-24">
        <span className="chip mb-5 bg-accent-soft text-accent font-semibold text-xs">
          {school ? `${school.name} · Subdomain: ${school.slug}.kairo.com` : "Kairo Platform · Multi-Tenant School Infrastructure"}
        </span>

        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl text-fg">
          {school ? (
            <>Empowering Teachers at <span className="text-accent">{school.name}</span></>
          ) : (
            <>Multi-Tenant School Platform for <span className="text-accent">Teacher Excellence</span></>
          )}
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-lg text-fg/70 leading-relaxed">
          {school ? (
            `Welcome to ${school.name}'s secure teacher portal. Manage classes, submit administrative requests, access curriculum materials, and collaborate with your AI pedagogical assistant.`
          ) : (
            "Kairo provides isolated, secure school environments for teacher administration, curriculum-grounded learning, and pedagogical intelligence — with zero data leakage across tenants."
          )}
        </p>

        <p className="mt-3 font-semibold text-accent tracking-wide text-sm">
          Teach with Quality. Learn with Intelligence.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/login" className="btn-primary text-sm px-5 py-2.5">
            {school ? `Sign in to ${school.name}` : "Sign in to School Portal"}
          </Link>
          <Link to="/demo" className="btn-outline text-sm px-5 py-2.5">
            Try Interactive Demo
          </Link>
          {isMainDomain && (
            <Link to="/admin/login" className="btn-ghost text-sm px-5 py-2.5 border border-fg/10">
              Super Admin Console →
            </Link>
          )}
        </div>
      </section>

      {/* Platform Pillars */}
      <section className="bg-surface py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-bold text-fg">
            {isMainDomain ? "Platform Architecture & Tenant Security" : "Teaching Modules & Capabilities"}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-fg/70 text-sm">
            Strict boundaries ensure that users, classes, learning materials, and audit logs belonging to one school are strictly inaccessible to all other institutions.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {platformFeatures.map((f) => (
              <div key={f.title} className="card p-6 border border-fg/10 hover:border-accent/30 transition">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent text-xl">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-base text-fg mb-1">{f.title}</h3>
                <p className="text-xs text-fg/65 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Steps */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold text-fg">How Kairo Works</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="card p-6 border border-fg/10">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-bold text-white mb-3">
                {s.n}
              </div>
              <h3 className="font-semibold text-base text-fg">{s.t}</h3>
              <p className="mt-1.5 text-xs text-fg/65 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Domain Architecture Callout */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="card overflow-hidden border border-fg/10 bg-gradient-to-br from-surface to-bg p-8">
          <div className="grid items-center gap-6 md:grid-cols-2">
            <div>
              <span className="badge bg-purple-100 text-purple-800 text-xs font-semibold mb-2">
                Domain Architecture
              </span>
              <h3 className="text-2xl font-bold text-fg mb-3">
                Subdomain Resolution & Defense-In-Depth
              </h3>
              <p className="text-sm text-fg/70 leading-relaxed space-y-2">
                Each school receives an isolated subdomain (such as <code className="font-mono text-accent">royal.kairo.com</code> or <code className="font-mono text-accent">oxford.kairo.com</code>). Tenant context is verified server-side at the database layer using Postgres Row-Level Security, preventing IDOR and cross-school data tampering.
              </p>
            </div>

            <div className="rounded-2xl bg-fg/90 p-5 font-mono text-xs text-bg space-y-2 shadow-xl">
              <div className="text-emerald-400 font-bold">// Server-Side Tenant Resolution</div>
              <div className="text-fg/40">GET royal.kairo.com/api/teachers</div>
              <div className="text-purple-300">→ auth_uid() resolved</div>
              <div className="text-purple-300">→ auth_school_id() = 'school_001'</div>
              <div className="text-emerald-400">✓ RLS Filter: school_id = 'school_001'</div>
              <div className="text-red-400">✗ Foreign Tenant IDs Blocked (403 Forbidden)</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
