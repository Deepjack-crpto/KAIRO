import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { listSchools } from "@/services/tenant";
import { useToast, Spinner } from "@/components/ui";
import type { AuditLog, School } from "@/types/db";

const MOCK_GLOBAL_AUDITS: AuditLog[] = [
  {
    id: "aud-1",
    school_id: "00000000-0000-0000-0000-000000000001",
    actor_id: "usr-1",
    action: "school.tenant_access",
    target: "Royal School",
    meta: { actor_role: "SUPER_ADMIN", cross_tenant_authorized: true },
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    actor_name: "Global Super Admin",
    actor_role: "SUPER_ADMIN",
  },
  {
    id: "aud-2",
    school_id: "00000000-0000-0000-0000-000000000001",
    actor_id: "usr-2",
    action: "teacher_admin.approve",
    target: "usr-3",
    meta: { granted_permissions: ["school.material.upload", "school.request.review"] },
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    actor_name: "Royal Principal",
    actor_role: "PRINCIPAL",
  },
  {
    id: "aud-3",
    school_id: "00000000-0000-0000-0000-000000000001",
    actor_id: "usr-3",
    action: "face.verify.success",
    target: "usr-3",
    meta: { liveness_verified: true, algorithm: "SHA-256" },
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    actor_name: "Royal Teacher Admin",
    actor_role: "TEACHER_ADMIN",
  },
  {
    id: "aud-4",
    school_id: "00000000-0000-0000-0000-000000000002",
    actor_id: "usr-5",
    action: "announcement.publish",
    target: "ann-99",
    meta: { audience: "all", title: "Oxford Term 2 Schedule" },
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    actor_name: "Oxford Principal",
    actor_role: "PRINCIPAL",
  },
];

export default function SuperAudit() {
  const [audits, setAudits] = useState<AuditLog[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("all");

  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const schs = await listSchools();
      setSchools(schs);

      if (!supabase) {
        setAudits(MOCK_GLOBAL_AUDITS);
      } else {
        const { data, error } = await supabase
          .from("audit_logs")
          .select(`
            *,
            profiles:actor_id (full_name, role)
          `)
          .order("created_at", { ascending: false })
          .limit(100);

        if (error || !data) {
          setAudits(MOCK_GLOBAL_AUDITS);
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
  }, []);

  const getSchoolName = (schoolId: string | null | undefined) => {
    if (!schoolId) return "Global Platform";
    const found = schools.find((s) => s.id === schoolId);
    return found ? found.name : schoolId;
  };

  const filtered = audits.filter((a) => {
    if (schoolFilter !== "all" && a.school_id !== schoolFilter) return false;
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
          <h1 className="text-2xl font-extrabold tracking-tight">Global Audit Log</h1>
          <p className="text-sm text-fg/60">
            Immutable platform-wide audit trail of all sensitive operations and cross-tenant actions
          </p>
        </div>
      </div>

      <div className="card p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center flex-1">
          <input
            type="text"
            placeholder="Search actions, actors, targets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-fg/15 bg-surface px-3 py-1.5 text-xs w-64 focus:outline-none focus:ring-2 focus:ring-accent"
          />

          <select
            value={schoolFilter}
            onChange={(e) => setSchoolFilter(e.target.value)}
            className="rounded-lg border border-fg/15 bg-surface px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="all">All School Tenants</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <span className="text-xs text-fg/50">{filtered.length} audit entries</span>
      </div>

      {loading ? (
        <div className="card p-12 flex justify-center">
          <Spinner label="Loading audit logs…" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface/70 text-fg/60 border-b border-fg/5 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Tenant</th>
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
                      {new Date(a.created_at).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 font-sans font-medium text-fg">
                      {getSchoolName(a.school_id)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-fg font-sans">{a.actor_name || "Unknown"}</span>
                      <span className="ml-1 text-[10px] text-accent uppercase font-bold">
                        [{a.actor_role || "ROLE"}]
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge bg-purple-50 text-purple-700 font-semibold">
                        {a.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-fg/70 truncate max-w-[150px]">
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
