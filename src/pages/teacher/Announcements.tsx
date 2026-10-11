import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { useTenant } from "@/lib/tenant";
import { listAnnouncements } from "@/services/announcements";
import { Spinner } from "@/components/ui";
import type { Announcement } from "@/types/db";

export default function TeacherAnnouncements() {
  const { profile } = useAuth();
  const { school } = useTenant();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (school && profile) {
      listAnnouncements({
        schoolId: school.id,
        isPublishedOnly: true,
        userRole: profile.role,
        department: profile.department,
      })
        .then((data) => setAnnouncements(data))
        .finally(() => setLoading(false));
    }
  }, [school, profile]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Principal Announcements</h1>
        <p className="text-sm text-fg/60">
          Official bulletins and communications from {school?.name || "the Principal's office"}
        </p>
      </div>

      {loading ? (
        <div className="card p-12 flex justify-center">
          <Spinner label="Loading announcements…" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="card p-12 text-center text-sm text-fg/50">
          No announcements published for your department at this time.
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <div key={a.id} className="card p-6 space-y-3 border border-fg/10 hover:border-accent/30 transition">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-bold text-lg text-fg">{a.title}</h2>
                  <span className="text-xs text-fg/50 block mt-0.5">
                    From {a.publisher_name || "Principal's Office"} ·{" "}
                    {new Date(a.created_at).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <span className="badge bg-purple-50 text-purple-700 text-[10px] font-semibold uppercase">
                  Audience: {a.audience.replace("_", " ")}
                </span>
              </div>

              <div className="bg-surface/40 p-4 rounded-xl border border-fg/5 text-sm text-fg/80 leading-relaxed whitespace-pre-line">
                {a.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
