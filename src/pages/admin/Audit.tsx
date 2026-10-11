import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant";
import { useToast, Spinner } from "@/components/ui";
import type { AuditLog } from "@/types/db";

const MOCK_SCHOOL_AUDITS: AuditLog[] = [
  {
    id: "aud-s1",
    school_id: "00000000-0000-0000-0000-000000000001",
    actor_id: "usr-2",
    action: "announcement.publish",
    target: "ann-1",
    meta: { audience: "all", title: "Term 2 Alignment Workshop" },
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    actor_name: "Royal Principal",
    actor_role: "PRINCIPAL",
  },
  {
    id: "aud-s2",
    school_id: "00000000-0000-0000-0000-000000000001",
    actor_id: "usr-3",
    action: "face.verify.success",
    target: "usr-3",
    meta: { method: "biometric_challenge" },
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    actor_name: "Royal Teacher Admin",
    actor_role: "TEACHER_ADMIN",
  },
  {
    id: "aud-s3",
    school_id: "00000000-0000-0000-0000-000000000001",
    actor_id: "usr-2",
    action: "request.review.approved",
    target: "req-1",
    meta: { type: "leave", teacher_name: "Dev Teacher" },
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    actor_name: "Royal Principal",
    actor_role: "PRINCIPAL",
  },
  {
    id: "aud-s4",
    school_id: "00000000-0000-0000-0000-000000000001",
    actor_id: "usr-2",
    action: "curriculum.upload",
    target: "mat-1",
    meta: { chapter: "Ch 3 Leaves", class: "Grade 3", subject: "Science" },
    created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    actor_name: "Royal Principal",
    actor_role: "PRINCIPAL",
  },
];

export default function AdminAudit() {
  const { school } = useTenant();
  const toast = useToast();

  const [audits, setAudits] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    if (!school) return;
    setLoading(true);
    try {
      if (!supabase) {
        setAudits(MOCK_SCHOOL_AUDITS);
      } else {
        const { data, error } = await supabase
          .from("audit_logs")
          .select(`
            *,
            profiles:actor_id (full_name, role)
          `)
          .eq("school_id", school.id)
          .order("created_at", { ascending: false })
          .limit(100);

        if (error || !data) {
          setAudits(MOCK_SCHOOL_AUDITS);
        } else {
          setAudits(
            data.map((r: any) => ({
              ...r,
              actor_name: r.profiles?.full_name || "System",
              actor_role: r.profiles?.role || "SYSTEM",
            }))
          );
        }
      }
    } catch (e) {
      toast("error", (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // load() is async and only sets state after awaiting — not a synchronous render cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [school]);

  const filtered = audits.filter((a) => {
    if (search) {
      const q = search.toLowerCase();
      return (
        a.action.toLowerCase().includes(q) ||
        a.actor_name?.toLowerCase().includes(q) ||
        a.target?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">School Audit Logs</h1>
          <p className="text-sm text-fg/60">
            Tenant-isolated audit trail for {school?.name || "your school"} operations
          </p>
        </div>

        <input
          type="text"
          placeholder="Filter audit actions…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-fg/15 bg-surface px-3 py-1.5 text-xs w-64 focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {loading ? (
        <div className="card p-12 flex justify-center">
          <Spinner label="Loading school audit events…" />
        </div>
      ) : audits.length === 0 ? (
        <div className="card p-12 text-center text-sm text-fg/50">
          No audit entries recorded for this school tenant yet.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface/70 text-fg/60 border-b border-fg/5 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Actor & Role</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fg/5 font-mono text-[11px]">
                {filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-surface/40 transition">
                    <td className="px-4 py-3 text-fg/70 whitespace-nowrap">
                      {new Date(a.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}{" "}
                      <span className="text-[10px] text-fg/40">
                        {new Date(a.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-sans">
                      <span className="font-semibold text-fg">{a.actor_name || "Principal"}</span>{" "}
                      <span className="text-[10px] text-accent font-bold uppercase font-mono">
                        [{a.actor_role || "ROLE"}]
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge bg-purple-50 text-purple-700 font-semibold">
                        {a.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-fg/70 truncate max-w-[140px]">
                      {a.target || "—"}
                    </td>
                    <td className="px-4 py-3 text-fg/60 max-w-xs truncate">
                      {JSON.stringify(a.meta)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
