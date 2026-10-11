import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/features/auth/AuthContext";
import { useAsync } from "@/lib/useAsync";
import { listAdmins, listTeachers } from "@/services/catalog";
import { inviteAdmin, setUserRole, setUserStatus, sendPasswordRecovery } from "@/services/admin";
import { inviteTeacherSchema } from "@/lib/schemas";
import { EmptyState, Skeleton, StatusBadge, ConfirmDialog, useToast } from "@/components/ui";
import type { Profile } from "@/types/db";

const roleLabel: Record<Profile["role"], string> = {
  super_admin: "Super admin",
  admin: "Principal",
  principal: "Principal",
  teacher_admin: "Teacher Admin",
  teacher: "Teacher",
};

/**
 * Super-admin-only control centre for administrators. A principal (plain admin)
 * can never reach this route (guarded by RequireSuperAdmin) and the Edge
 * Function re-checks super_admin on every mutation — client checks are UX only.
 */
export default function Administrators() {
  const toast = useToast();
  const { profile } = useAuth();
  const admins = useAsync(() => listAdmins(), []);
  const teachers = useAsync(() => listTeachers(), []);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [promoteId, setPromoteId] = useState("");
  const [confirm, setConfirm] = useState<null | { run: () => Promise<unknown>; label: string; danger?: boolean }>(null);

  function reload() { admins.reload(); teachers.reload(); }

  async function run(action: () => Promise<unknown>, ok: string) {
    try { await action(); toast("success", ok); reload(); }
    catch (err: any) { toast("error", err.message); }
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    const parsed = inviteTeacherSchema.safeParse({ email, fullName: name });
    if (!parsed.success) { toast("error", parsed.error.issues[0].message); return; }
    setBusy(true);
    try {
      await inviteAdmin(parsed.data.email, parsed.data.fullName);
      toast("success", `Administrator invite sent to ${parsed.data.email}`);
      setEmail(""); setName(""); reload();
    } catch (err: any) { toast("error", err.message); }
    finally { setBusy(false); }
  }

  const promotable = teachers.data ?? [];

  return (
    <>
      <PageHeader title="Administrators" subtitle="Super-admin control over every principal account." />

      <form onSubmit={invite} className="card mb-6 grid gap-3 p-5 sm:grid-cols-[1fr_1fr_auto]">
        <input className="input" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input" type="email" placeholder="principal@royalschool.example" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="btn-primary" disabled={busy}>Invite administrator</button>
      </form>

      <div className="card mb-6 flex flex-wrap items-center gap-3 p-5">
        <span className="text-sm text-fg/70">Promote an existing teacher to principal:</span>
        <select className="input max-w-xs" value={promoteId} onChange={(e) => setPromoteId(e.target.value)}>
          <option value="">Select a teacher…</option>
          {promotable.map((t) => (
            <option key={t.id} value={t.id}>{t.full_name || t.email}</option>
          ))}
        </select>
        <button
          className="btn-outline"
          disabled={!promoteId}
          onClick={() => {
            const t = promotable.find((x) => x.id === promoteId);
            setConfirm({
              label: `Promote ${t?.email} to principal (admin)?`,
              run: () => setUserRole(promoteId, "admin").then(() => setPromoteId("")),
            });
          }}
        >
          Promote
        </button>
      </div>

      {(admins.error || teachers.error) && <p className="mb-4 text-sm text-accent">{admins.error || teachers.error}</p>}

      {admins.loading ? <Skeleton className="h-40" /> :
        !admins.data?.length ? <EmptyState title="No administrators yet" hint="Invite an administrator above." /> : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left text-fg/60">
                <tr>
                  <th className="p-3">Name</th><th className="p-3">Email</th>
                  <th className="p-3">Role</th><th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fg/5">
                {admins.data.map((a) => {
                  const self = a.id === profile?.id;
                  return (
                    <tr key={a.id}>
                      <td className="p-3 font-medium">{a.full_name || "—"}{self && <span className="ml-2 chip">you</span>}</td>
                      <td className="p-3 text-fg/70">{a.email}</td>
                      <td className="p-3"><span className="chip">{roleLabel[a.role]}</span></td>
                      <td className="p-3"><StatusBadge status={a.status} /></td>
                      <td className="p-3">
                        {self ? <span className="text-fg/40">—</span> : (
                          <div className="flex flex-wrap justify-end gap-2">
                            {a.role === "admin"
                              ? <button className="btn-ghost px-3 py-1.5" onClick={() => setConfirm({ label: `Make ${a.email} a SUPER admin? They will gain full control.`, danger: true, run: () => setUserRole(a.id, "super_admin") })}>Make super admin</button>
                              : <button className="btn-ghost px-3 py-1.5" onClick={() => setConfirm({ label: `Demote ${a.email} to principal (admin)?`, run: () => setUserRole(a.id, "admin") })}>Make principal</button>}
                            <button className="btn-ghost px-3 py-1.5" onClick={() => setConfirm({ label: `Demote ${a.email} to teacher? They lose all admin access.`, danger: true, run: () => setUserRole(a.id, "teacher") })}>Demote to teacher</button>
                            {a.status === "active"
                              ? <button className="btn-outline px-3 py-1.5" onClick={() => setConfirm({ label: `Suspend ${a.email}?`, danger: true, run: () => setUserStatus(a.id, "suspended") })}>Suspend</button>
                              : <button className="btn-outline px-3 py-1.5" onClick={() => run(() => setUserStatus(a.id, "active"), "Activated")}>Activate</button>}
                            <button className="btn-ghost px-3 py-1.5" onClick={() => run(() => sendPasswordRecovery(a.email), "Recovery email sent")}>Reset password</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      <ConfirmDialog
        open={!!confirm} danger={confirm?.danger} title="Confirm action" body={confirm?.label}
        confirmLabel="Confirm"
        onCancel={() => setConfirm(null)}
        onConfirm={() => { const c = confirm; setConfirm(null); if (c) run(c.run, "Done"); }}
      />
    </>
  );
}
