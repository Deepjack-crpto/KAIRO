import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import { useTenant } from "@/lib/tenant";
import { Logo } from "@/components/ui";
import { TenantBar } from "@/components/TenantBar";
import { NotificationCenter } from "@/components/NotificationCenter";

export interface NavItem { to: string; label: string; icon: string }
export interface NavGroup { heading?: string; items: NavItem[] }

function roleLabel(kind: "admin" | "teacher", role?: string | null) {
  if (role === "super_admin") return "Super Admin";
  if (role === "principal" || (kind === "admin" && role === "admin")) return "Principal";
  if (role === "teacher_admin") return "Teacher Admin";
  return "Teacher";
}

function initials(name?: string | null, email?: string | null) {
  const base = (name || email || "?").trim();
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return base.slice(0, 2).toUpperCase();
}

export default function PortalLayout({ groups, kind }: { groups: NavGroup[]; kind: "admin" | "teacher" }) {
  const { profile, signOut } = useAuth();
  const { school } = useTenant();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);

  async function handleSignOut() {
    await signOut();
    nav(kind === "admin" ? "/admin/login" : "/teacher/login", { replace: true });
  }

  const name = profile?.full_name || profile?.email || "Signed in";
  const label = roleLabel(kind, profile?.role);

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Top Tenant status strip */}
      <TenantBar />

      <div className="flex-1 lg:grid lg:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-fg/5 bg-card p-4 transition-transform lg:static lg:translate-x-0 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="mb-6 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Logo size={28} />
              <span className="chip text-[11px] font-bold">{label}</span>
            </div>
            {school && (
              <span className="text-[11px] font-semibold text-fg/60 truncate block px-0.5">
                🏫 {school.name}
              </span>
            )}
          </div>

          <nav className="flex flex-1 flex-col gap-5 overflow-y-auto">
            {groups.map((group, gi) => (
              <div key={group.heading ?? gi} className="flex flex-col gap-1">
                {group.heading && (
                  <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-fg/40">
                    {group.heading}
                  </p>
                )}
                {group.items.map((it) => (
                  <NavLink
                    key={it.to}
                    to={it.to}
                    end
                    onClick={() => setOpen(false)}
                    className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}
                  >
                    <span aria-hidden className="w-5 text-center">{it.icon}</span>
                    {it.label}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>

          <div className="mt-4 border-t border-fg/5 pt-3">
            <div className="mb-2 flex items-center gap-3">
              <Avatar name={profile?.full_name} email={profile?.email} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{name}</p>
                <p className="truncate text-xs text-fg/50">{label}</p>
              </div>
            </div>
            <button className="btn-outline w-full text-xs py-1.5" onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        </aside>

        {open && <div className="fixed inset-0 z-30 bg-fg/30 lg:hidden" onClick={() => setOpen(false)} />}

        <div className="flex min-h-screen flex-col">
          {/* Persistent top header */}
          <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-fg/5 bg-bg/85 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button className="btn-ghost lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
                ☰
              </button>
              <span className="lg:hidden">
                <Logo size={22} />
              </span>
              {school && (
                <span className="hidden sm:inline-block font-semibold text-xs text-fg/70">
                  {school.name}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <NotificationCenter />

              {/* User identity + avatar menu */}
              <div className="relative">
                <button
                  onClick={() => setMenu((m) => !m)}
                  className="flex items-center gap-3 rounded-full py-1 pl-3 pr-1 text-left transition-colors hover:bg-surface"
                >
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium leading-tight">{name}</p>
                    <p className="text-xs text-fg/50">{label}</p>
                  </div>
                  <Avatar name={profile?.full_name} email={profile?.email} />
                </button>
                {menu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
                    <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-fg/10 bg-card p-2 shadow-card">
                      <div className="border-b border-fg/5 px-3 py-2">
                        <p className="truncate text-sm font-medium">{name}</p>
                        <p className="truncate text-xs text-fg/50">{profile?.email}</p>
                      </div>
                      <button
                        onClick={() => { setMenu(false); handleSignOut(); }}
                        className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-accent hover:bg-accent-soft"
                      >
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8"><Outlet /></main>
        </div>
      </div>
    </div>
  );
}

function Avatar({ name, email }: { name?: string | null; email?: string | null }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">
      {initials(name, email)}
    </span>
  );
}
