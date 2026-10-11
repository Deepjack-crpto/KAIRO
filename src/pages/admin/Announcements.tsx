import React, { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { useTenant } from "@/lib/tenant";
import {
  listAnnouncements,
  createAnnouncement,
  publishAnnouncement,
} from "@/services/announcements";
import { useToast, Spinner, StatusBadge } from "@/components/ui";
import type { Announcement, AnnouncementAudience } from "@/types/db";

export default function AdminAnnouncements() {
  const { profile } = useAuth();
  const { school } = useTenant();
  const toast = useToast();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [audience, setAudience] = useState<AnnouncementAudience>("all");
  const [department, setDepartment] = useState("");
  const [publishImmediately, setPublishImmediately] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!school) return;
    setLoading(true);
    try {
      const data = await listAnnouncements({ schoolId: school.id });
      setAnnouncements(data);
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    if (!school || !profile) return;

    setSubmitting(true);
    try {
      await createAnnouncement({
        school_id: school.id,
        title,
        content,
        audience,
        target_department: audience === "department" ? department : null,
        publish_now: publishImmediately,
        published_by: profile.id,
      });

      toast("success", publishImmediately ? "Announcement published to teachers." : "Announcement draft saved.");
      setModalOpen(false);
      setTitle("");
      setContent("");
      load();
    } catch (err) {
      toast("error", (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (id: string) => {
    if (!school || !profile) return;
    try {
      await publishAnnouncement(id, school.id, profile.id);
      toast("success", "Announcement published.");
      load();
    } catch (e) {
      toast("error", (e as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Principal Announcements</h1>
          <p className="text-sm text-fg/60">
            Publish official communications targeted to teachers and departments
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary text-sm flex items-center gap-2"
        >
          <span>+ New Announcement</span>
        </button>
      </div>

      {loading ? (
        <div className="card p-12 flex justify-center">
          <Spinner label="Loading school announcements…" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="card p-12 text-center text-sm text-fg/50">
          No announcements published yet. Click "New Announcement" to broadcast to teaching staff.
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <div key={a.id} className="card p-5 space-y-3 hover:border-fg/15 transition">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-fg">{a.title}</h3>
                    <StatusBadge status={a.is_published ? "ready" : "queued"} />
                    <span className="badge bg-purple-50 text-purple-700 text-[10px] font-semibold uppercase">
                      Audience: {a.audience.replace("_", " ")}
                    </span>
                  </div>
                  <span className="text-xs text-fg/50 mt-0.5 block">
                    Published by {a.publisher_name || "Principal"} ·{" "}
                    {new Date(a.created_at).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {!a.is_published && (
                  <button
                    onClick={() => handlePublish(a.id)}
                    className="btn-primary text-xs px-3 py-1.5"
                  >
                    Publish Now →
                  </button>
                )}
              </div>

              <p className="text-sm text-fg/80 leading-relaxed bg-surface/40 p-4 rounded-xl border border-fg/5">
                {a.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* New Announcement Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-lg p-6 bg-bg shadow-2xl relative">
            <h2 className="text-lg font-bold text-fg mb-1">Create School Announcement</h2>
            <p className="text-xs text-fg/60 mb-4">
              Tenant-scoped communication sent to authorized teachers of {school?.name}.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-fg mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CBSE Pedagogical Alignment Workshop"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-fg/15 bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-fg mb-1">Target Audience</label>
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value as AnnouncementAudience)}
                    className="w-full rounded-lg border border-fg/15 bg-surface px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="all">All Teachers</option>
                    <option value="teacher_admins">Teacher Admins Only</option>
                    <option value="department">Specific Department</option>
                  </select>
                </div>

                {audience === "department" && (
                  <div>
                    <label className="block text-xs font-medium text-fg mb-1">Department</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Science"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full rounded-lg border border-fg/15 bg-surface px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-fg mb-1">Content</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Write announcement details for teachers…"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full rounded-lg border border-fg/15 bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-fg/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={publishImmediately}
                  onChange={(e) => setPublishImmediately(e.target.checked)}
                  className="rounded border-fg/20 text-accent focus:ring-accent"
                />
                <span>Publish immediately to teacher dashboards & notification center</span>
              </label>

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
                  {submitting ? "Broadcasting…" : publishImmediately ? "Publish Announcement" : "Save as Draft"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
