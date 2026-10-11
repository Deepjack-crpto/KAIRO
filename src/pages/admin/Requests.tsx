import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { useTenant } from "@/lib/tenant";
import { listRequests, reviewRequest } from "@/services/requests";
import { useToast, Spinner, StatusBadge } from "@/components/ui";
import type { TeacherRequest, RequestStatus } from "@/types/db";

export default function AdminRequests() {
  const { profile } = useAuth();
  const { school } = useTenant();
  const toast = useToast();

  const [requests, setRequests] = useState<TeacherRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "all">("all");
  const [selectedReq, setSelectedReq] = useState<TeacherRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  const load = async () => {
    if (!school) return;
    setLoading(true);
    try {
      const data = await listRequests({
        schoolId: school.id,
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      setRequests(data);
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
  }, [school, statusFilter]);

  const handleReview = async (status: "approved" | "rejected") => {
    if (!selectedReq || !profile || !school) return;
    try {
      await reviewRequest({
        requestId: selectedReq.id,
        reviewerId: profile.id,
        status,
        reviewNotes,
        schoolId: school.id,
      });
      toast("success", `Request ${status}.`);
      setSelectedReq(null);
      setReviewNotes("");
      load();
    } catch (e) {
      toast("error", (e as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Teacher Requests Review</h1>
          <p className="text-sm text-fg/60">
            Review and adjudicate leave requests, extra periods, and schedule adjustments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-fg/60">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-lg border border-fg/15 bg-surface px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="card p-12 flex justify-center">
          <Spinner label="Loading requests…" />
        </div>
      ) : requests.length === 0 ? (
        <div className="card p-12 text-center text-sm text-fg/50">
          No teacher requests found matching the current filter.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface/70 text-fg/60 border-b border-fg/5 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">Teacher</th>
                  <th className="px-4 py-3">Request Type</th>
                  <th className="px-4 py-3">Summary & Details</th>
                  <th className="px-4 py-3">Date Submitted</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fg/5">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-surface/40 transition">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-fg">{r.teacher_name}</div>
                      <div className="text-[11px] text-fg/50 font-mono">{r.teacher_email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge bg-purple-50 text-purple-700 uppercase font-semibold text-[10px]">
                        {r.type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-fg">{r.title}</div>
                      <div className="text-fg/60 text-[11px] mt-0.5">
                        {r.type === "leave" && (
                          <span>Date: {r.details?.date} · Duration: {r.details?.duration}</span>
                        )}
                        {r.type === "extra_period" && (
                          <span>Requested Period: {r.details?.requested_period}</span>
                        )}
                        {r.details?.reason && (
                          <span className="block truncate max-w-xs italic text-fg/50">
                            "{r.details.reason}"
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-fg/60 whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={
                          r.status === "approved"
                            ? "active"
                            : r.status === "rejected"
                            ? "failed"
                            : "queued"
                        }
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.status === "pending" ? (
                        <button
                          onClick={() => setSelectedReq(r)}
                          className="btn-primary text-[11px] px-3 py-1"
                        >
                          Review →
                        </button>
                      ) : (
                        <span className="text-[11px] text-fg/40">Resolved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md p-6 bg-bg shadow-2xl relative">
            <h3 className="font-bold text-lg text-fg mb-1">Review Request</h3>
            <p className="text-xs text-fg/60 mb-4">
              Submitted by <span className="font-semibold text-fg">{selectedReq.teacher_name}</span>
            </p>

            <div className="bg-surface/70 rounded-lg p-3.5 text-xs text-fg/80 mb-4 space-y-2 border border-fg/5">
              <div className="flex justify-between">
                <span className="text-fg/50 font-medium">Type:</span>
                <span className="uppercase font-semibold text-accent">{selectedReq.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-fg/50 font-medium">Title:</span>
                <span className="font-medium text-fg">{selectedReq.title}</span>
              </div>
              <div>
                <span className="text-fg/50 font-medium block mb-1">Details:</span>
                <p className="p-2 rounded bg-bg text-fg/90 italic">
                  {selectedReq.details?.reason || JSON.stringify(selectedReq.details)}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-fg mb-1">Decision Comments / Notes</label>
              <textarea
                rows={3}
                placeholder="Enter feedback for the teacher…"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="w-full rounded-lg border border-fg/15 bg-surface px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSelectedReq(null)}
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
                Approve Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
