import { useState, useRef } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useAsync } from "@/lib/useAsync";
import { listTeachers } from "@/services/catalog";
import { inviteTeacher, resendInvite, setTeacherStatus, sendPasswordRecovery } from "@/services/admin";
import { validateTeacherImportCSV, executeTeacherImport, type ImportValidationResult } from "@/services/bulkImport";
import { useAuth } from "@/features/auth/AuthContext";
import { useTenant } from "@/lib/tenant";
import { inviteTeacherSchema } from "@/lib/schemas";
import { EmptyState, Skeleton, StatusBadge, ConfirmDialog, useToast } from "@/components/ui";

export default function Teachers() {
  const toast = useToast();
  const { profile } = useAuth();
  const { school } = useTenant();

  const { data, loading, error, reload } = useAsync(() => listTeachers(), []);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<null | { id: string; status: "suspended" | "active" | "deactivated"; label: string }>(null);

  // Bulk Import state
  const [importModal, setImportModal] = useState(false);
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    const parsed = inviteTeacherSchema.safeParse({ email, fullName: name });
    if (!parsed.success) { toast("error", parsed.error.issues[0].message); return; }
    setBusy(true);
    try {
      await inviteTeacher(parsed.data.email, parsed.data.fullName);
      toast("success", `Invitation sent to ${parsed.data.email}`);
      setEmail(""); setName(""); reload();
    } catch (err: any) { toast("error", err.message); }
    finally { setBusy(false); }
  }

  async function changeStatus(id: string, status: "suspended" | "active" | "deactivated") {
    try { await setTeacherStatus(id, status); toast("success", "Status updated"); reload(); }
    catch (err: any) { toast("error", err.message); }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = String(evt.target?.result || "");
      const existing = (data || []).map((t) => t.email);
      try {
        const res = await validateTeacherImportCSV(text, existing);
        setValidationResult(res);
      } catch (err: any) {
        toast("error", err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmBulkImport = async () => {
    if (!validationResult || !validationResult.validRows.length || !school || !profile) return;
    setImporting(true);
    try {
      const { created, errors } = await executeTeacherImport({
        schoolId: school.id,
        actorsId: profile.id,
        teachers: validationResult.validRows,
      });

      if (created > 0) {
        toast("success", `Successfully imported ${created} teacher accounts.`);
        setImportModal(false);
        setValidationResult(null);
        reload();
      }
      if (errors.length > 0) {
        toast("error", `Import issues: ${errors.join(", ")}`);
      }
    } catch (err: any) {
      toast("error", err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <PageHeader title="Teachers" subtitle={`Manage teaching staff accounts for ${school?.name || "your school"}.`} />
        <button
          onClick={() => setImportModal(true)}
          className="btn-outline text-xs flex items-center gap-2 whitespace-nowrap"
        >
          <span>📁 Bulk CSV Import</span>
        </button>
      </div>

      <form onSubmit={invite} className="card mb-6 grid gap-3 p-5 sm:grid-cols-[1fr_1fr_auto]">
        <input className="input" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input" type="email" placeholder="teacher@royalschool.edu" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="btn-primary" disabled={busy}>Invite teacher</button>
      </form>

      {error && <p className="mb-4 text-sm text-accent">{error}</p>}
      {loading ? <Skeleton className="h-40" /> :
        !data?.length ? <EmptyState title="No teachers yet" hint="Invite your first teacher above or use Bulk CSV Import." /> : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left text-fg/60">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fg/5">
                {data.map((t) => (
                  <tr key={t.id}>
                    <td className="p-3 font-medium">{t.full_name || "—"}</td>
                    <td className="p-3 text-fg/70">{t.email}</td>
                    <td className="p-3">
                      <span className="badge bg-purple-50 text-purple-700 text-[10px] uppercase font-semibold">
                        {t.role}
                      </span>
                    </td>
                    <td className="p-3"><StatusBadge status={t.status} /></td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        {t.status === "active"
                          ? <button className="btn-outline px-3 py-1.5" onClick={() => setConfirm({ id: t.id, status: "suspended", label: `Suspend ${t.email}?` })}>Suspend</button>
                          : <button className="btn-outline px-3 py-1.5" onClick={() => changeStatus(t.id, "active")}>Activate</button>}
                        <button className="btn-ghost px-3 py-1.5" onClick={() => resendInvite(t.email).then(() => toast("success", "Invitation resent")).catch((e) => toast("error", e.message))}>Resend</button>
                        <button className="btn-ghost px-3 py-1.5" onClick={() => sendPasswordRecovery(t.email).then(() => toast("success", "Recovery email sent")).catch((e) => toast("error", e.message))}>Reset password</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      {/* Bulk CSV Import Modal */}
      {importModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-2xl p-6 bg-bg shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-fg mb-1">Bulk Teacher Import</h2>
            <p className="text-xs text-fg/60 mb-4">
              Upload a CSV file containing teacher columns: <code className="font-mono bg-surface px-1 py-0.5 rounded">Email, Full Name, Department, Phone</code>
            </p>

            <div className="mb-4">
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-outline text-xs w-full py-4 border-dashed border-2 flex flex-col items-center justify-center gap-1 text-fg/70 hover:text-fg"
              >
                <span className="text-2xl">📄</span>
                <span>Select CSV File from Computer</span>
              </button>
            </div>

            {validationResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-lg">
                    <span className="font-bold text-lg block">{validationResult.validRows.length}</span>
                    <span className="text-[11px]">Valid Records</span>
                  </div>
                  <div className="bg-amber-50 text-amber-800 p-2.5 rounded-lg">
                    <span className="font-bold text-lg block">{validationResult.duplicates.length}</span>
                    <span className="text-[11px]">Duplicates</span>
                  </div>
                  <div className="bg-red-50 text-red-800 p-2.5 rounded-lg">
                    <span className="font-bold text-lg block">{validationResult.invalidRows.length}</span>
                    <span className="text-[11px]">Errors</span>
                  </div>
                </div>

                {/* Preview Valid */}
                {validationResult.validRows.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-fg mb-1">Preview Valid Records:</h3>
                    <div className="max-h-36 overflow-y-auto border border-fg/10 rounded-lg">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-surface text-fg/60">
                          <tr>
                            <th className="p-2">Name</th>
                            <th className="p-2">Email</th>
                            <th className="p-2">Department</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-fg/5">
                          {validationResult.validRows.map((r, idx) => (
                            <tr key={idx}>
                              <td className="p-2 font-medium">{r.fullName}</td>
                              <td className="p-2 font-mono text-[11px] text-fg/70">{r.email}</td>
                              <td className="p-2 text-fg/70">{r.department || "General"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Validation Errors */}
                {validationResult.invalidRows.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-danger mb-1">Records with Errors:</h3>
                    <div className="max-h-28 overflow-y-auto bg-red-50/50 p-2 rounded-lg text-xs space-y-1 text-danger">
                      {validationResult.invalidRows.map((err, idx) => (
                        <div key={idx}>
                          Row {err.row}: {err.errors.join(", ")}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-5 border-t border-fg/5 mt-4">
              <button
                type="button"
                onClick={() => {
                  setImportModal(false);
                  setValidationResult(null);
                }}
                className="btn-outline text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!validationResult || validationResult.validRows.length === 0 || importing}
                onClick={handleConfirmBulkImport}
                className="btn-primary text-xs"
              >
                {importing ? "Importing…" : `Confirm & Import ${validationResult?.validRows.length || 0} Teachers`}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirm} danger title="Confirm action" body={confirm?.label}
        confirmLabel="Suspend"
        onCancel={() => setConfirm(null)}
        onConfirm={() => { if (confirm) changeStatus(confirm.id, confirm.status); setConfirm(null); }}
      />
    </>
  );
}
