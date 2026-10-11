import { Link } from "react-router-dom";

export default function PortalSelect() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20">
      <h1 className="text-center text-3xl font-bold">Choose your portal</h1>
      <p className="mt-2 text-center text-fg/65">Administrators and teachers sign in separately.</p>
      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        <Link to="/admin/login" className="card group p-8 transition hover:border-accent/40">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-surface text-accent text-xl">⚙</div>
          <h2 className="text-lg font-semibold group-hover:text-accent">Administrator</h2>
          <p className="mt-1.5 text-sm text-fg/65">Manage teachers, classes, assignments and curriculum.</p>
        </Link>
        <Link to="/teacher/login" className="card group p-8 transition hover:border-accent/40">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent text-xl">☺</div>
          <h2 className="text-lg font-semibold group-hover:text-accent">Teacher</h2>
          <p className="mt-1.5 text-sm text-fg/65">Access your materials and generate classroom resources.</p>
        </Link>
      </div>
    </div>
  );
}
