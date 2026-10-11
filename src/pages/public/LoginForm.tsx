import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import { useTenant } from "@/lib/tenant";
import { RedirectIfAuthed } from "@/app/guards";
import { loginSchema } from "@/lib/schemas";
import { supabase } from "@/lib/supabase";
import { Logo, Spinner } from "@/components/ui";
import { TenantBar } from "@/components/TenantBar";

const REMEMBER_KEY = "kairo.rememberedEmail";

export default function LoginForm({
  kind, title, subtitle,
}: { kind: "admin" | "teacher"; title: string; subtitle: string }) {
  const { signIn, configured, devAuth } = useAuth();
  const { school } = useTenant();
  const canSignIn = configured || devAuth;
  const nav = useNavigate();

  const remembered = (() => {
    try { return localStorage.getItem(REMEMBER_KEY) ?? ""; } catch { return ""; }
  })();

  const [email, setEmail] = useState(remembered);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(!!remembered);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setNotice(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) { setErr(parsed.error.issues[0].message); return; }
    try {
      if (remember) localStorage.setItem(REMEMBER_KEY, parsed.data.email);
      else localStorage.removeItem(REMEMBER_KEY);
    } catch { /* ignore storage errors */ }
    setBusy(true);

    const { error } = await signIn(parsed.data.email, parsed.data.password, school?.id || null);
    setBusy(false);
    if (error) { setErr(error); return; }

    const lower = parsed.data.email.toLowerCase();
    if (lower.includes("super")) {
      nav("/super/schools", { replace: true });
    } else if (kind === "admin" || lower.includes("principal") || lower.includes("admin")) {
      nav("/admin/dashboard", { replace: true });
    } else {
      nav("/teacher/dashboard", { replace: true });
    }
  }

  async function forgotPassword() {
    setErr(null); setNotice(null);
    if (!email) { setErr("Enter your email first, then tap Forgot password."); return; }
    if (devAuth) { setNotice("Password reset is disabled in dev preview mode."); return; }
    if (!supabase) { setErr("Supabase is not configured yet."); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) setErr(error.message);
    else setNotice("If that email has an account, a reset link is on its way.");
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <TenantBar />

      <div className="flex-1 grid lg:grid-cols-2">
        <RedirectIfAuthed />

        {/* Left: the form */}
        <div className="flex items-center justify-center bg-bg px-6 py-10">
          <div className="w-full max-w-md">
            <div className="mb-6 flex items-center justify-between">
              <Link to="/"><Logo size={30} /></Link>
              <div className="flex items-center gap-2">
                <span className="chip">{kind === "admin" ? "Admin Portal" : "Teacher Portal"}</span>
                {school && (
                  <span className="badge bg-surface text-fg/70 text-xs font-semibold">
                    {school.name}
                  </span>
                )}
              </div>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-fg">
              {title} <span aria-hidden>👋</span>
            </h1>
            <p className="mt-2 text-sm text-fg/60">
              {school ? `Authorized access for ${school.name}` : subtitle}
            </p>

            {devAuth && (
              <div className="mt-5 rounded-xl border border-sky-300 bg-sky-50 p-3 text-xs text-sky-900 leading-relaxed space-y-1">
                <strong>Dev Multi-Tenant Mock Logins (Any password):</strong>
                <div className="font-mono text-[11px] space-y-0.5 pt-1">
                  <div>🌐 Super Admin: <code>super@kairo.com</code> (Global cross-tenant)</div>
                  <div>🏫 Royal Principal: <code>principal@royalschool.edu</code></div>
                  <div>⭐ Royal Teacher Admin: <code>teacheradmin@royalschool.edu</code></div>
                  <div>☺ Royal Teacher: <code>teacher@royalschool.edu</code></div>
                  <div>🎓 Oxford Principal: <code>principal@oxford.edu</code></div>
                </div>
              </div>
            )}

            {!configured && !devAuth && (
              <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                Supabase is not configured yet. Set <code>VITE_SUPABASE_URL</code> and{" "}
                <code>VITE_SUPABASE_ANON_KEY</code> to enable sign-in.
              </div>
            )}

            <form className="mt-6 space-y-4" onSubmit={submit}>
              <div>
                <label className="label" htmlFor="email">Email Address <span className="text-accent">*</span></label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="input"
                  placeholder="teacher@royalschool.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="password">Password <span className="text-accent">*</span></label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPw ? "text" : "password"}
                    autoComplete="current-password"
                    className="input pr-11"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-fg/50 hover:text-fg"
                  >
                    {showPw ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex cursor-pointer items-center gap-2 text-fg/70">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-fg/30 text-accent focus:ring-accent"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={forgotPassword}
                  className="font-medium text-accent hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              {err && <p role="alert" className="text-xs text-accent font-medium">{err}</p>}
              {notice && <p className="text-xs text-green-700 font-medium">{notice}</p>}

              <button className="btn-primary w-full py-2.5 text-sm" disabled={busy || !canSignIn}>
                {busy ? <Spinner label="Signing in…" /> : "Sign in to Portal"}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between text-xs text-fg/60">
              <Link to={kind === "admin" ? "/teacher/login" : "/admin/login"} className="hover:text-accent">
                {kind === "admin" ? "Teacher Login →" : "Admin Login →"}
              </Link>
              <Link to="/" className="hover:text-accent">Back to Home</Link>
            </div>
          </div>
        </div>

        {/* Right: branded panel */}
        <div
          className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12 text-white"
          style={{
            background: school
              ? `linear-gradient(135deg, ${school.primary_color} 0%, ${school.secondary_color} 100%)`
              : "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
          }}
        >
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10" />
          <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-black/10" />

          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
              {school ? `${school.name} · CBSE Classes 1–5` : "Kairo Platform Infrastructure"}
            </span>
          </div>

          <div className="relative max-w-md">
            <h2 className="text-4xl font-bold leading-tight">
              Teach with Quality.<br />Learn with Intelligence.
            </h2>
            <p className="mt-4 text-white/85 text-sm leading-relaxed">
              Curriculum-grounded learning and secure administration built exclusively for primary school teachers.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-4">
              <Stat value="1–5" label="CBSE Classes" />
              <Stat value="RLS" label="Tenant Isolated" />
              <Stat value="AI" label="Pedagogy Assistant" />
            </div>
          </div>

          <p className="relative text-xs text-white/60">
            {school ? `Tenant Domain: ${school.slug}.kairo.com` : "Platform Global Control Layer"}
          </p>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-xl font-bold">{value}</div>
      <div className="mt-0.5 text-[11px] text-white/70">{label}</div>
    </div>
  );
}

function Eye() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOff() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.5 13.5 0 0 0 2 12s3.5 7 10 7a9.12 9.12 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}
