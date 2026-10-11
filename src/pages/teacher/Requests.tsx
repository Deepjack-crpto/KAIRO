import React, { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { useTenant } from "@/lib/tenant";
import { listRequests, submitRequest } from "@/services/requests";
import { useToast, Spinner, StatusBadge } from "@/components/ui";
import type { TeacherRequest, RequestType } from "@/types/db";

export default function TeacherRequests() {
  const { profile } = useAuth();
  const { school } = useTenant();
  const toast = useToast();

  const [requests, setRequests] = useState<TeacherRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [reqType, setReqType] = useState<RequestType>("leave");
  const [title, setTitle] = useState("");
  const [reason, setReason] = useState("");
  const [leaveDate, setLeaveDate] = useState("");
  const [duration, setDuration] = useState("1 day");
  const [requestedPeriod, setRequestedPeriod] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!profile || !school) return;
    setLoading(true);
    try {
      const data = await listRequests({
        schoolId: school.id,
        teacherId: profile.id,
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
  }, [profile, school]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school || !profile) return;
    if (!title.trim() || !reason.trim()) return;

    setSubmitting(true);
    try {
      const details: Record<string, unknown> = { reason };

      if (reqType === "leave") {
        details.date = leaveDate || new Date().toISOString().split("T")[0];
        details.duration = duration;
      } else if (reqType === "extra_period") {
        details.requested_period = requestedPeriod;
      } else if (reqType === "teacher_admin") {
        details.requested_permissions = [
          "school.material.upload",
          "school.request.review",
        ];
      }

      await submitRequest({
        school_id: school.id,
        teacher_id: profile.id,
        type: reqType,
        title,
        details,
      });

      toast("success", "Request submitted to Principal.");
      setModalOpen(false);
      setTitle("");
      setReason("");
      load();
    } catch (err: any) {
      toast("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Permissions & Requests</h1>
          <p className="text-sm text-fg/60">
            Submit leave requests, extra periods, or request Teacher Admin elevation
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary text-sm flex items-center gap-2"
        >
          <span>+ Submit Request</span>
        </button>
      </div>

      {loading ? (
        <div className="card p-12 flex justify-center">
          <Spinner label="Loading requests…" />
        </div>
      ) : requests.length === 0 ? (
        <div className="card p-12 text-center text-sm text-fg/50">
          You have not submitted any requests yet. Click "+ Submit Request" above to send a request to the Principal.
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r.id} className="card p-5 space-y-3 hover:border-fg/15 transition">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-fg">{r.title}</h3>
                    <StatusBadge
                      status={
                        r.status === "approved"
                          ? "active"
                          : r.status === "rejected"
                          ? "failed"
                          : "queued"
                      }
                    />
                    <span className="badge bg-purple-50 text-purple-700 text-[10px] font-semibold uppercase">
                      {r.type.replace("_", " ")}
                    </span>
                  </div>
                  <span className="text-xs text-fg/50 mt-0.5 block">
                    Submitted on{" "}
                    {new Date(r.created_at).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              <div className="bg-surface/50 p-3.5 rounded-xl border border-fg/5 text-xs text-fg/80 space-y-1">
                {r.details?.date && (
                  <p>
                    <strong>Date:</strong> {String(r.details.date)} ({String(r.details.duration || "1 day")})
                  </p>
                )}
                {r.details?.requested_period && (
                  <p>
                    <strong>Requested Period:</strong> Period {String(r.details.requested_period)}
                  </p>
                )}
                <p>
                  <strong>Reason:</strong> {String(r.details?.reason || r.title)}
                </p>
                {r.review_notes && (
                  <div className="pt-2 border-t border-fg/10 text-accent font-medium">
                    Principal Notes: {r.review_notes}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Request Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-lg p-6 bg-bg shadow-2xl relative">
            <h2 className="text-lg font-bold text-fg mb-1">Submit Request to Principal</h2>
            <p className="text-xs text-fg/60 mb-4">
              Your request will be delivered to the Principal's office with an auditable lifecycle.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-fg mb-1">Request Type</label>
                <select
                  value={reqType}
                  onChange={(e) => {
                    const t = e.target.value as RequestType;
                    setReqType(t);
                    if (t === "teacher_admin") {
                      setTitle("Request for Teacher Admin Privileges");
                    } else if (t === "leave") {
                      setTitle("Leave Request");
                    } else if (t === "extra_period") {
                      setTitle("Extra Period Request");
                    } else {
                      setTitle("Schedule Adjustment");
                    }
                  }}
                  className="w-full rounded-lg border border-fg/15 bg-surface px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="leave">Leave Request (Sick / Personal)</option>
                  <option value="extra_period">Extra Period Request</option>
                  <option value="schedule">Schedule / Free Period Request</option>
                  <option value="teacher_admin">Request Teacher Admin Elevation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-fg mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-fg/15 bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              {reqType === "leave" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-fg mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={leaveDate}
                      onChange={(e) => setLeaveDate(e.target.value)}
                      className="w-full rounded-lg border border-fg/15 bg-surface px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-fg mb-1">Duration</label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full rounded-lg border border-fg/15 bg-surface px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="Half Day (Morning)">Half Day (Morning)</option>
                      <option value="Half Day (Afternoon)">Half Day (Afternoon)</option>
                      <option value="1 day">1 Full Day</option>
                      <option value="2 days">2 Days</option>
                      <option value="3+ days">3+ Days</option>
                    </select>
                  </div>
                </div>
              )}

              {reqType === "extra_period" && (
                <div>
                  <label className="block text-xs font-medium text-fg mb-1">Requested Period Number</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={requestedPeriod}
                    onChange={(e) => setRequestedPeriod(Number(e.target.value))}
                    className="w-full rounded-lg border border-fg/15 bg-surface px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-fg mb-1">
                  Reason & Detailed Justification
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide clear rationale for the Principal's review…"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-lg border border-fg/15 bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-outline text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs"
                >
                  {submitting ? "Submitting…" : "Send to Principal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
