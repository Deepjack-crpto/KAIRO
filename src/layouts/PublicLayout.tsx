import { Link, NavLink, Outlet } from "react-router-dom";
import { Logo } from "@/components/ui";
import { TenantBar } from "@/components/TenantBar";
import { useTenant } from "@/lib/tenant";

export default function PublicLayout() {
  const { school, isMainDomain } = useTenant();

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <TenantBar />

      <header className="sticky top-0 z-30 border-b border-fg/5 bg-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
          <Link to="/" aria-label="KAIRO home" className="flex items-center gap-2">
            <Logo />
            {school && (
              <span className="text-xs font-semibold text-fg/60 border-l border-fg/15 pl-2">
                {school.name}
              </span>
            )}
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <NavLink to="/demo" className="btn-ghost text-xs">Interactive Demo</NavLink>
            <NavLink to="/privacy" className="btn-ghost hidden sm:inline-flex text-xs">Security & Privacy</NavLink>
            {isMainDomain && (
              <Link to="/admin/login" className="btn-ghost text-xs hidden sm:inline-flex">
                Super Admin Login
              </Link>
            )}
            <Link to="/login" className="btn-primary text-xs">Sign in</Link>
          </nav>
        </div>
      </header>
      <main className="flex-1"><Outlet /></main>
      <footer className="border-t border-fg/5 bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-fg/60 sm:flex-row">
          <span>
            © {new Date().getFullYear()} KAIRO Multi-Tenant Platform · {school ? school.name : "Platform Main Layer"}
          </span>
          <div className="flex gap-4 text-xs">
            <Link to="/privacy" className="hover:text-fg">Privacy & Data Isolation</Link>
            <a href="mailto:contact@kairo.com" className="hover:text-fg">Contact Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
