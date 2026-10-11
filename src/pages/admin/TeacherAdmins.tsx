import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/AuthContext";
import { useTenant } from "@/lib/tenant";
import { listRequests, reviewRequest } from "@/services/requests";
import { PERMISSIONS } from "@/lib/permissions";
import { useToast, Spinner, StatusBadge } from "@/components/ui";
import type { Profile, TeacherRequest } from "@/types/db";

const AVAILABLE_PERMS = [
  { code: PERMISSIONS.MATERIAL_UPLOAD, name: "Upload Learning Materials", desc: "Upload and publish teacher materials" },
  { code: PERMISSIONS.REQUEST_REVIEW, name: "Review Teacher Requests", desc: "Approve or reject leave & extra period requests" },
  { code: PERMISSIONS.AUDIT_VIEW, name: "View School Audit Log", desc: "Inspect school-level audit trail" },
  { code: PERMISSIONS.TIMETABLE_MANAGE, name: "Manage Timetable", desc: "Reassign class and period schedules" },
  { code: PERMISSIONS.TEACHER_VIEW, name: "View Teacher Profiles", desc: "Inspect teacher rosters and departments" },
];

export default function AdminTeacherAdmins() {
  const { profile } = useAuth();
  const { school } = useTenant();
  const toast = useToast();

  const [teacherAdmins, setTeacherAdmins] = useState<Profile[]>([]);
  const [requests, setRequests] = useState<TeacherRequest[]>([]);
  const [permissionsMap, setPermissionsMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  // Review modal state
  const [reviewingReq, setReviewingReq] = useState<TeacherRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  const load = async () => {
    if (!school) return;
    setLoading(true);
    try {
      // 1. Load pending Teacher Admin requests
      const reqs = await listRequests({
        schoolId: school.id,
        status: "pending",
      });
      setRequests(reqs.filter((r) => r.type === "teacher_admin"));

      // 2. Load active Teacher Admins
      if (!supabase) {
        setTeacherAdmins([
          {
            id: "usr-3",
            email: "teacheradmin@royalschool.edu",
            full_name: "Royal Teacher Admin",
            role: "teacher_admin",
            status: "active",
            school_id: school.id,
            phone: "+1 555-0102",
            address: "Royal Campus",
            avatar_url: "",
            degree: "M.Sc Physics",
            degree_certificate_url: "",
            department: "Science",
            joining_date: "2023-08-15",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
        setPermissionsMap({
          "usr-3": [PERMISSIONS.MATERIAL_UPLOAD, PERMISSIONS.REQUEST_REVIEW, PERMISSIONS.AUDIT_VIEW],
        });
      } else {
        const { data: tas } = await supabase
          .from("profiles")
          .select("*")
          .eq("school_id", school.id)
          .eq("role", "teacher_admin");

        setTeacherAdmins((tas as Profile[]) || []);

        // Load permissions
        const { data: perms } = await supabase
          .from("teacher_admin_permissions")
          .select("teacher_id, permission_code")
          .eq("school_id", school.id);

        const map: Record<string, string[]> = {};
        perms?.forEach((p: any) => {
          if (!map[p.teacher_id]) map[p.teacher_id] = [];
          map[p.teacher_id].push(p.permission_code);
        });
        setPermissionsMap(map);
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

  const handleReview = async (status: "approved" | "rejected") => {
    if (!reviewingReq || !profile || !school) return;
    try {
      await reviewRequest({
        requestId: reviewingReq.id,
        reviewerId: profile.id,
        status,
        reviewNotes,
        schoolId: school.id,
      });
      toast("success", `Teacher Admin request ${status}.`);
      setReviewingReq(null);
      setReviewNotes("");
      load();
    } catch (e) {
      toast("error", (e as Error).message);
    }
  };

  const handleTogglePermission = async (teacherId: string, permCode: string) => {
    if (!school || !profile) return;
    const current = permissionsMap[teacherId] || [];
    const hasIt = current.includes(permCode);

    try {
      if (supabase) {
        if (hasIt) {
          await supabase
            .from("teacher_admin_permissions")
            .delete()
            .eq("teacher_id", teacherId)
            .eq("permission_code", permCode)
            .eq("school_id", school.id);
        } else {
          await supabase.from("teacher_admin_permissions").insert({
            school_id: school.id,
            teacher_id: teacherId,
            permission_code: permCode,
            granted_by: profile.id,
          });
        }
      }

      setPermissionsMap((prev) => ({
        ...prev,
        [teacherId]: hasIt
          ? current.filter((c) => c !== permCode)
          : [...current, permCode],
      }));
      toast("success", `Updated permissions for Teacher Admin.`);
    } catch (e) {
      toast("error", (e as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Teacher Admin Management</h1>
        <p className="text-sm text-fg/60">
          Manage teacher administrative elevations, review requests, and configure granular privileges
        </p>
      </div>

      {/* Pending Teacher Admin Requests */}
      <div className="card p-5 border border-fg/10">
        <h2 className="font-bold text-base text-fg flex items-center gap-2 mb-3">
          <span>📬 Pending Elevation Requests</span>
          {requests.length > 0 && (
            <span className="badge bg-amber-100 text-amber-800 text-xs">
              {requests.length} pending
            </span>
          )}
        </h2>

        {requests.length === 0 ? (
          <p className="text-xs text-fg/50 py-3">No pending Teacher Admin requests from teachers.</p>
        ) : (
          <div className="divide-y divide-fg/5">
            {requests.map((r) => (
              <div key={r.id} className="py-3 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-fg">{r.teacher_name}</span>
                    <span className="text-xs text-fg/50 font-mono">({r.teacher_email})</span>
                  </div>
                  <p className="text-xs text-fg/70 mt-1">
                    <strong className="text-fg">Reason:</strong> {r.details?.reason || r.title}
                  </p>
                  {r.details?.requested_permissions && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {r.details.requested_permissions.map((p: string) => (
                        <span key={p} className="badge bg-surface text-fg/70 text-[10px]">
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setReviewingReq(r)}
                  className="btn-primary text-xs px-3 py-1.5 whitespace-nowrap"
                >
                  Review Request →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Teacher Admins Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-fg/5 flex items-center justify-between">
          <h2 className="font-bold text-base text-fg">Active Teacher Admins ({teacherAdmins.length})</h2>
          <span className="text-xs text-fg/50">Granular permissions configured below</span>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <Spinner label="Loading Teacher Admins…" />
          </div>
        ) : teacherAdmins.length === 0 ? (
          <div className="p-12 text-center text-sm text-fg/50">
            No teachers currently hold the Teacher Admin role.
          </div>
        ) : (
          <div className="divide-y divide-fg/5">
            {teacherAdmins.map((ta) => {
              const activePerms = permissionsMap[ta.id] || [];
              return (
                <div key={ta.id} className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-fg">{ta.full_name}</span>
                        <StatusBadge status="active" />
                        <span className="badge bg-purple-50 text-purple-700 font-semibold text-[10px]">
                          TEACHER ADMIN
                        </span>
                      </div>
                      <p className="text-xs text-fg/60 font-mono mt-0.5">{ta.email} · {ta.department}</p>
                    </div>
                  </div>

                  {/* Granular Permission Toggles */}
                  <div className="bg-surface/50 rounded-xl p-3 border border-fg/5">
                    <span className="text-xs font-semibold text-fg/80 block mb-2">
                      Granted Administrative Privileges:
                    </span>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {AVAILABLE_PERMS.map((perm) => {
                        const isGranted = activePerms.includes(perm.code);
                        return (
                          <label
                            key={perm.code}
                            className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition ${
                              isGranted
                                ? "bg-accent-soft/40 border-accent/30 text-fg"
                                : "bg-bg border-fg/10 text-fg/60 hover:bg-surface"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isGranted}
                              onChange={() => handleTogglePermission(ta.id, perm.code)}
                              className="mt-0.5 rounded border-fg/20 text-accent focus:ring-accent"
                            />
                            <div>
                              <span className="font-semibold block">{perm.name}</span>
                              <span className="text-[10px] text-fg/50 leading-tight block">
                                {perm.desc}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md p-6 bg-bg shadow-2xl relative">
            <h3 className="font-bold text-lg text-fg mb-1">Review Teacher Admin Request</h3>
            <p className="text-xs text-fg/60 mb-4">
              Submitted by <span className="font-semibold text-fg">{reviewingReq.teacher_name}</span>
            </p>

            <div className="bg-surface/70 rounded-lg p-3 text-xs text-fg/80 mb-4 space-y-1">
              <p><strong>Reason:</strong> {reviewingReq.details?.reason || reviewingReq.title}</p>
              <p><strong>Department:</strong> {reviewingReq.teacher_department || "General"}</p>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-fg mb-1">Review Notes / Conditions</label>
              <textarea
                rows={3}
                placeholder="e.g. Approved for managing Grade 2 Science materials and reviewing schedule requests."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="w-full rounded-lg border border-fg/15 bg-surface px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setReviewingReq(null)}
                className="btn-outline text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReview("rejected")}
                className="btn-outline text-xs text-danger border-danger/30 hover:bg-red-50"
              >
                Reject Request
              </button>
              <button
                onClick={() => handleReview("approved")}
                className="btn-primary text-xs"
              >
                Approve & Grant Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
