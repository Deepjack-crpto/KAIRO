import PortalLayout, { type NavGroup } from "./PortalLayout";

const groups: NavGroup[] = [
  { heading: "Overview", items: [{ to: "/teacher/dashboard", label: "Dashboard", icon: "▦" }] },
  {
    heading: "Teaching & Learning",
    items: [
      { to: "/teacher/learning", label: "Learning Platform", icon: "🧠" },
      { to: "/teacher/ai-assistant", label: "AI Assistant", icon: "🤖" },
      { to: "/teacher/materials", label: "Curriculum Materials", icon: "▣" },
      { to: "/teacher/activities", label: "Activities", icon: "✦" },
      { to: "/teacher/worksheets", label: "Worksheets", icon: "✎" },
      { to: "/teacher/quizzes", label: "Quizzes", icon: "✓" },
    ],
  },
  {
    heading: "Schedule & Requests",
    items: [
      { to: "/teacher/timetable", label: "My Timetable", icon: "📅" },
      { to: "/teacher/requests", label: "Permissions & Requests", icon: "📬" },
      { to: "/teacher/announcements", label: "Announcements", icon: "📢" },
    ],
  },
  {
    heading: "Account",
    items: [
      { to: "/teacher/history", label: "History", icon: "↻" },
      { to: "/teacher/profile", label: "Profile & Face ID", icon: "☺" },
    ],
  },
];

export default function TeacherLayout() {
  return <PortalLayout groups={groups} kind="teacher" />;
}
