import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/features/auth/AuthContext";
import { useTenant } from "@/lib/tenant";
import { useAsync } from "@/lib/useAsync";
import { myAssignments, listSubjects, listClasses } from "@/services/catalog";
import { listMaterials } from "@/services/materials";
import { listTeacherTimetable, computeScheduleStatus } from "@/services/timetable";
import { listAnnouncements } from "@/services/announcements";
import { listRequests } from "@/services/requests";
import { Skeleton, StatusBadge } from "@/components/ui";
import type { TimetableRow, Announcement, TeacherRequest } from "@/types/db";

const quick = [
  { to: "/teacher/learning", label: "Teacher Learning", icon: "🧠" },
  { to: "/teacher/ai-assistant", label: "AI Assistant", icon: "🤖" },
  { to: "/teacher/timetable", label: "My Timetable", icon: "📅" },
  { to: "/teacher/requests", label: "My Requests", icon: "📬" },
  { to: "/teacher/activities", label: "New activity", icon: "✦" },
  { to: "/teacher/worksheets", label: "New worksheet", icon: "✎" },
  { to: "/teacher/quizzes", label: "New quiz", icon: "✓" },
  { to: "/teacher/materials", label: "Curriculum", icon: "▣" },
];

export default function Dashboard() {
  const { profile, configured } = useAuth();
  const { school } = useTenant();

  const assignments = useAsync(() => (configured ? myAssignments() : Promise.resolve([])), []);
  const subjects = useAsync(() => (configured ? listSubjects() : Promise.resolve([])), []);
  const classes = useAsync(() => (configured ? listClasses() : Promise.resolve([])), []);
  const materials = useAsync(() => (configured ? listMaterials() : Promise.resolve([])), []);

  const [timetable, setTimetable] = useState<TimetableRow[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [requests, setRequests] = useState<TeacherRequest[]>([]);

  useEffect(() => {
    if (profile && school) {
      listTeacherTimetable(profile.id, school.id).then(setTimetable);
      listAnnouncements({
        schoolId: school.id,
        isPublishedOnly: true,
        userRole: profile.role,
        department: profile.department,
      }).then(setAnnouncements);
      listRequests({
        schoolId: school.id,
        teacherId: profile.id,
      }).then(setRequests);
    }
  }, [profile, school]);

  const scheduleStatus = computeScheduleStatus(timetable);

  return (
    <>
      <PageHeader
        title={`Welcome, ${profile?.full_name?.split(" ")[0] || "Teacher"}`}
        subtitle={`Teacher workspace & learning portal at ${school?.name || "Kairo"}.`}
      />

      {/* Today's Timetable Status Ribbon */}
      <div className="card mb-6 p-4 border border-fg/10 bg-surface/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">⏱️</span>
            <span className="font-bold text-sm text-fg">Today's Class Schedule</span>
          </div>
          <Link to="/teacher/timetable" className="text-xs text-accent font-semibold hover:underline">
            View Full Timetable →
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="p-3 rounded-xl bg-bg border border-fg/5">
            <span className="text-[10px] uppercase font-bold text-fg/40 block mb-0.5">Previous Class</span>
            {scheduleStatus.previousClass ? (
              <div>
                <span className="font-bold text-xs text-fg">{scheduleStatus.previousClass.subjectName}</span>
                <span className="text-[11px] text-fg/60 block">{scheduleStatus.previousClass.className} · {scheduleStatus.previousClass.start_time} - {scheduleStatus.previousClass.end_time}</span>
              </div>
            ) : (
              <span className="text-xs text-fg/40 italic">None today</span>
            )}
          </div>

          <div className="p-3 rounded-xl bg-accent-soft/30 border border-accent/30">
            <span className="text-[10px] uppercase font-bold text-accent block mb-0.5">Current Class</span>
            {scheduleStatus.currentClass ? (
              <div>
                <span className="font-bold text-sm text-fg">{scheduleStatus.currentClass.subjectName}</span>
                <span className="text-xs text-fg/70 block">{scheduleStatus.currentClass.className} (Sec {scheduleStatus.currentClass.sectionName}) · {scheduleStatus.currentClass.room || "Room 101"}</span>
              </div>
            ) : (
              <span className="text-xs text-fg/60 italic font-medium">Free Period right now</span>
            )}
          </div>

          <div className="p-3 rounded-xl bg-bg border border-fg/5">
            <span className="text-[10px] uppercase font-bold text-fg/40 block mb-0.5">Next Class</span>
            {scheduleStatus.nextClass ? (
              <div>
                <span className="font-bold text-xs text-fg">{scheduleStatus.nextClass.subjectName}</span>
                <span className="text-[11px] text-fg/60 block">{scheduleStatus.nextClass.className} · Starts {scheduleStatus.nextClass.start_time}</span>
              </div>
            ) : (
              <span className="text-xs text-fg/40 italic">No more classes today</span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {quick.map((q) => (
          <Link
            key={q.to}
            to={q.to}
            className="card flex items-center gap-3 p-3.5 transition hover:border-accent/40 hover:shadow-sm"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent text-base">
              {q.icon}
            </span>
            <span className="text-xs font-semibold">{q.label}</span>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Principal Announcements */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm text-fg flex items-center gap-2">
              <span>📢 Principal Announcements</span>
            </h2>
            <Link to="/teacher/announcements" className="text-xs text-accent hover:underline">
              All →
            </Link>
          </div>

          {announcements.length === 0 ? (
            <p className="text-xs text-fg/50 italic py-2">No active announcements.</p>
          ) : (
            <div className="space-y-2">
              {announcements.slice(0, 2).map((a) => (
                <div key={a.id} className="p-3 rounded-xl bg-surface/50 border border-fg/5">
                  <span className="font-semibold text-xs text-fg block">{a.title}</span>
                  <p className="text-xs text-fg/70 mt-1 line-clamp-2">{a.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Requests Status */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm text-fg flex items-center gap-2">
              <span>📬 My Requests</span>
            </h2>
            <Link to="/teacher/requests" className="text-xs text-accent hover:underline">
              Submit Request →
            </Link>
          </div>

          {requests.length === 0 ? (
            <p className="text-xs text-fg/50 italic py-2">No pending or recent requests.</p>
          ) : (
            <div className="space-y-2">
              {requests.slice(0, 2).map((r) => (
                <div key={r.id} className="p-3 rounded-xl bg-surface/50 border border-fg/5 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-xs text-fg block">{r.title}</span>
                    <span className="text-[11px] text-fg/50">{r.type.replace("_", " ")}</span>
                  </div>
                  <StatusBadge
                    status={
                      r.status === "approved"
                        ? "active"
                        : r.status === "rejected"
                        ? "failed"
                        : "queued"
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Assignments */}
        <div className="card p-5">
          <h2 className="mb-3 font-semibold text-sm text-fg">My Assigned Classes</h2>
          {assignments.loading ? (
            <Skeleton className="h-24" />
          ) : !assignments.data?.length ? (
            <p className="text-xs text-fg/50">
              No assignments yet. Your school administrator assigns your classes.
            </p>
          ) : (
            <ul className="space-y-2 text-xs">
              {assignments.data.map((a) => {
                const c = classes.data?.find((x) => x.id === a.class_id);
                const s = subjects.data?.find((x) => x.id === a.subject_id);
                return (
                  <li key={a.id} className="rounded-xl bg-surface px-4 py-2.5 font-medium">
                    Class {c?.grade ?? "?"} · {s?.name ?? "?"}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Published Materials */}
        <div className="card p-5">
          <h2 className="mb-3 font-semibold text-sm text-fg">Curriculum Learning Materials</h2>
          {materials.loading ? (
            <Skeleton className="h-24" />
          ) : !materials.data?.length ? (
            <p className="text-xs text-fg/50">No materials available yet.</p>
          ) : (
            <ul className="space-y-2 text-xs">
              {materials.data.slice(0, 4).map((m) => (
                <li key={m.id}>
                  <Link
                    to={`/teacher/workspace/${m.id}`}
                    className="flex items-center justify-between rounded-xl bg-surface px-4 py-2.5 hover:text-accent font-medium"
                  >
                    <span>{m.title}</span>
                    <span className="text-fg/40">{m.chapter}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
