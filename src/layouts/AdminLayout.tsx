import PortalLayout, { type NavGroup } from "./PortalLayout";
import { useAuth } from "@/features/auth/AuthContext";

export default function AdminLayout() {
  const { profile } = useAuth();
  const isSuper = profile?.role === "super_admin";

  const groups: NavGroup[] = [
    { heading: "Overview", items: [{ to: "/admin/dashboard", label: "Dashboard", icon: "▦" }] },
    {
      heading: "People",
      items: [
        { to: "/admin/teachers", label: "Teachers", icon: "☺" },
        { to: "/admin/teacher-admins", label: "Teacher Admins", icon: "⭐" },
        ...(isSuper ? [{ to: "/admin/administrators", label: "Administrators", icon: "♛" }] : []),
      ],
    },
    {
      heading: "Academics",
      items: [
        { to: "/admin/classes", label: "Classes", icon: "▤" },
        { to: "/admin/assignments", label: "Assignments", icon: "⇄" },
        { to: "/admin/materials", label: "Curriculum", icon: "▣" },
        { to: "/admin/timetable", label: "Timetable", icon: "📅" },
      ],
    },
    {
      heading: "Communication & Workflow",
      items: [
        { to: "/admin/announcements", label: "Announcements", icon: "📢" },
        { to: "/admin/requests", label: "Teacher Requests", icon: "📬" },
      ],
    },
    {
      heading: "System & Governance",
      items: [
        { to: "/admin/audit", label: "Audit Logs", icon: "📜" },
        { to: "/admin/settings", label: "Settings", icon: "⚙" },
      ],
    },
  ];

  return <PortalLayout groups={groups} kind="admin" />;
}
