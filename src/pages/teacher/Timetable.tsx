import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { useTenant } from "@/lib/tenant";
import {
  listTeacherTimetable,
  computeScheduleStatus,
} from "@/services/timetable";
import { Spinner } from "@/components/ui";
import type { TimetableRow } from "@/types/db";

const DAYS = [
  { num: 1, label: "Monday" },
  { num: 2, label: "Tuesday" },
  { num: 3, label: "Wednesday" },
  { num: 4, label: "Thursday" },
  { num: 5, label: "Friday" },
];

export default function TeacherTimetable() {
  const { profile } = useAuth();
  const { school } = useTenant();

  const [timetable, setTimetable] = useState<TimetableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(1);

  useEffect(() => {
    if (profile && school) {
      listTeacherTimetable(profile.id, school.id)
        .then((data) => setTimetable(data))
        .finally(() => setLoading(false));
    }
  }, [profile, school]);

  const status = computeScheduleStatus(timetable);
  const daySchedule = timetable.filter((t) => t.day_of_week === selectedDay);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">My Teaching Timetable</h1>
        <p className="text-sm text-fg/60">
          Weekly schedule, period allocations, and assigned classroom locations
        </p>
      </div>

      {/* Today's Live Status Overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-4 border border-fg/10">
          <span className="text-[11px] font-semibold text-fg/50 uppercase tracking-wider block mb-1">
            Previous Class
          </span>
          {status.previousClass ? (
            <div>
              <span className="font-bold text-sm text-fg block">{status.previousClass.subjectName}</span>
              <span className="text-xs text-fg/60">
                {status.previousClass.className} · {status.previousClass.start_time} - {status.previousClass.end_time}
              </span>
            </div>
          ) : (
            <span className="text-xs text-fg/40 italic">No prior class today</span>
          )}
        </div>

        <div className="card p-4 border-2 border-accent/40 bg-accent-soft/20">
          <span className="text-[11px] font-semibold text-accent uppercase tracking-wider block mb-1">
            Current Active Class
          </span>
          {status.currentClass ? (
            <div>
              <span className="font-bold text-base text-fg block">{status.currentClass.subjectName}</span>
              <span className="text-xs text-fg/70 font-medium">
                {status.currentClass.className} (Sec {status.currentClass.sectionName}) · {status.currentClass.room || "Assigned Room"}
              </span>
            </div>
          ) : (
            <span className="text-xs text-fg/60 italic">Free Period right now</span>
          )}
        </div>

        <div className="card p-4 border border-fg/10">
          <span className="text-[11px] font-semibold text-fg/50 uppercase tracking-wider block mb-1">
            Next Upcoming Class
          </span>
          {status.nextClass ? (
            <div>
              <span className="font-bold text-sm text-fg block">{status.nextClass.subjectName}</span>
              <span className="text-xs text-fg/60">
                {status.nextClass.className} · Starts {status.nextClass.start_time}
              </span>
            </div>
          ) : (
            <span className="text-xs text-fg/40 italic">No more classes scheduled today</span>
          )}
        </div>
      </div>

      {/* Day Selector */}
      <div className="flex gap-2 border-b border-fg/10 pb-2 overflow-x-auto">
        {DAYS.map((d) => (
          <button
            key={d.num}
            onClick={() => setSelectedDay(d.num)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              selectedDay === d.num
                ? "bg-accent text-white shadow-sm"
                : "bg-surface text-fg/70 hover:text-fg hover:bg-surface/80"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Schedule Table */}
      {loading ? (
        <div className="card p-12 flex justify-center">
          <Spinner label="Loading schedule…" />
        </div>
      ) : daySchedule.length === 0 ? (
        <div className="card p-12 text-center text-sm text-fg/50">
          No classes scheduled for this day. Free day for lesson planning and preparation.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface/70 text-fg/60 border-b border-fg/5 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Class & Section</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Room</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fg/5 font-medium">
              {daySchedule.map((entry) => (
                <tr key={entry.id} className="hover:bg-surface/40 transition">
                  <td className="px-4 py-3">
                    <span className="badge bg-accent-soft text-accent font-bold">
                      Period {entry.period_number}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-fg/70">
                    {entry.start_time} - {entry.end_time}
                  </td>
                  <td className="px-4 py-3 text-fg">
                    {entry.className} (Sec {entry.sectionName})
                  </td>
                  <td className="px-4 py-3 text-fg font-bold">{entry.subjectName}</td>
                  <td className="px-4 py-3 text-fg/60">{entry.room || "Room 101"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
