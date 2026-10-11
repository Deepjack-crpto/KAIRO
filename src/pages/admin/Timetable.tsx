import { useState, useEffect } from "react";
import { useTenant } from "@/lib/tenant";
import { listSchoolTimetable } from "@/services/timetable";
import { useToast, Spinner } from "@/components/ui";
import type { TimetableRow } from "@/types/db";

const DAYS = [
  { num: 1, label: "Monday" },
  { num: 2, label: "Tuesday" },
  { num: 3, label: "Wednesday" },
  { num: 4, label: "Thursday" },
  { num: 5, label: "Friday" },
];

const PERIODS = [
  { num: 1, time: "09:00 - 10:00" },
  { num: 2, time: "10:00 - 11:00" },
  { num: 3, time: "11:15 - 12:15" },
  { num: 4, time: "12:15 - 01:15" },
  { num: 5, time: "02:00 - 03:00" },
];

export default function AdminTimetable() {
  const { school } = useTenant();
  const toast = useToast();

  const [timetable, setTimetable] = useState<TimetableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(1);

  const load = async () => {
    if (!school) return;
    setLoading(true);
    try {
      const data = await listSchoolTimetable(school.id);
      setTimetable(data);
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

  const getEntry = (day: number, period: number) => {
    return timetable.find((t) => t.day_of_week === day && t.period_number === period);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">School Timetable</h1>
          <p className="text-sm text-fg/60">
            Manage weekly schedules, period allocations, and assigned rooms
          </p>
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

      {loading ? (
        <div className="card p-12 flex justify-center">
          <Spinner label="Loading timetable schedule…" />
        </div>
      ) : (
        <div className="space-y-3">
          {PERIODS.map((p) => {
            const entry = getEntry(selectedDay, p.num);
            return (
              <div
                key={p.num}
                className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-accent/40 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent font-bold text-sm">
                    P{p.num}
                  </div>
                  <div>
                    <span className="text-xs font-mono text-fg/50 block">{p.time}</span>
                    {entry ? (
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-bold text-base text-fg">{entry.subjectName}</span>
                        <span className="badge bg-surface text-fg/80 text-xs">
                          {entry.className} · Sec {entry.sectionName}
                        </span>
                      </div>
                    ) : (
                      <span className="font-semibold text-fg/40 text-sm italic">
                        Free Period / Unassigned
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  {entry && (
                    <div className="text-right sm:block hidden">
                      <div className="font-medium text-fg">{entry.teacherName || "Assigned Teacher"}</div>
                      <div className="text-fg/50">{entry.room || "Room Assigned"}</div>
                    </div>
                  )}
                  <span className="badge bg-surface text-fg/60 text-xs">
                    {entry ? "Active Schedule" : "Available"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
