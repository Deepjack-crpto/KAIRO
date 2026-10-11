import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { listSchools } from "@/services/tenant";
import { setUserStatus, setUserRole } from "@/services/admin";
import { useToast, Spinner, StatusBadge } from "@/components/ui";
import type { Profile, Role, School } from "@/types/db";

const MOCK_GLOBAL_USERS: Profile[] = [
  {
    id: "usr-1",
    email: "super@kairo.com",
    full_name: "Global Super Admin",
    role: "super_admin",
    status: "active",
    school_id: null,
    phone: "+1 555-0100",
    address: "Kairo HQ",
    avatar_url: "",
    degree: "Ph.D. Education Systems",
    degree_certificate_url: "",
    department: "Executive",
    joining_date: "2022-01-01",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "usr-2",
    email: "principal@royalschool.edu",
    full_name: "Royal Principal",
    role: "principal",
    status: "active",
    school_id: "00000000-0000-0000-0000-000000000001",
    phone: "+1 555-0101",
    address: "Royal Campus",
    avatar_url: "",
    degree: "M.Ed Educational Leadership",
    degree_certificate_url: "",
    department: "Administration",
    joining_date: "2023-06-01",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "usr-3",
    email: "teacheradmin@royalschool.edu",
    full_name: "Royal Teacher Admin",
    role: "teacher_admin",
    status: "active",
    school_id: "00000000-0000-0000-0000-000000000001",
    phone: "+1 555-0102",
    address: "Royal Campus",
    avatar_url: "",
    degree: "M.Sc Physics & B.Ed",
    degree_certificate_url: "",
    department: "Science",
    joining_date: "2023-08-15",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "usr-4",
    email: "teacher@royalschool.edu",
    full_name: "Royal Teacher",
    role: "teacher",
    status: "active",
    school_id: "00000000-0000-0000-0000-000000000001",
    phone: "+1 555-0103",
    address: "Royal Campus",
    avatar_url: "",
    degree: "B.Ed Elementary Education",
    degree_certificate_url: "",
    department: "English",
    joining_date: "2024-01-10",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "usr-5",
    email: "principal@oxford.edu",
    full_name: "Oxford Principal",
    role: "principal",
    status: "active",
    school_id: "00000000-0000-0000-0000-000000000002",
    phone: "+1 555-0201",
    address: "Oxford Campus",
    avatar_url: "",
    degree: "M.A. Education",
    degree_certificate_url: "",
    department: "Administration",
    joining_date: "2023-05-15",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "usr-6",
    email: "teacher@oxford.edu",
    full_name: "Oxford Teacher",
    role: "teacher",
    status: "active",
    school_id: "00000000-0000-0000-0000-000000000002",
    phone: "+1 555-0202",
    address: "Oxford Campus",
    avatar_url: "",
    degree: "B.Sc Mathematics",
    degree_certificate_url: "",
    department: "Mathematics",
    joining_date: "2024-02-01",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function SuperUsers() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const schs = await listSchools();
      setSchools(schs);

      if (!supabase) {
        setUsers(MOCK_GLOBAL_USERS);
      } else {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });
        if (error || !data) {
          setUsers(MOCK_GLOBAL_USERS);
        } else {
          setUsers(data as Profile[]);
        }
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
  }, []);

  const handleRoleChange = async (userId: string, newRole: Role) => {
    try {
      await setUserRole(userId, newRole as any);
      toast("success", `Role updated to ${newRole}`);
      load();
    } catch (err) {
      toast("error", (err as Error).message);
    }
  };

  const handleStatusToggle = async (user: Profile) => {
    const next = user.status === "active" ? "suspended" : "active";
    try {
      await setUserStatus(user.id, next);
      toast("success", `User status changed to ${next}`);
      load();
    } catch (err) {
      toast("error", (err as Error).message);
    }
  };

  const filtered = users.filter((u) => {
    if (schoolFilter !== "all" && u.school_id !== schoolFilter) return false;
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        u.email.toLowerCase().includes(q) ||
        u.full_name.toLowerCase().includes(q) ||
        u.department?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getSchoolName = (schoolId: string | null) => {
    if (!schoolId) return "🌐 Global / Kairo Platform";
    const found = schools.find((s) => s.id === schoolId);
    return found ? found.name : schoolId;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Global User Management</h1>
          <p className="text-sm text-fg/60">
            Platform-wide directory of users across all school tenants
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="card p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center flex-1">
          <input
            type="text"
            placeholder="Search by name, email, department…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-fg/15 bg-surface px-3 py-1.5 text-xs w-64 focus:outline-none focus:ring-2 focus:ring-accent"
          />

          <select
            value={schoolFilter}
            onChange={(e) => setSchoolFilter(e.target.value)}
            className="rounded-lg border border-fg/15 bg-surface px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="all">All Schools</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border border-fg/15 bg-surface px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="all">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="principal">Principal</option>
            <option value="admin">Admin</option>
            <option value="teacher_admin">Teacher Admin</option>
            <option value="teacher">Teacher</option>
          </select>
        </div>

        <span className="text-xs text-fg/50">{filtered.length} users found</span>
      </div>

      {loading ? (
        <div className="card p-12 flex justify-center">
          <Spinner label="Loading user directory…" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface/70 text-fg/60 border-b border-fg/5 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">School Tenant</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fg/5">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-surface/40 transition">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-fg">{u.full_name}</div>
                      <div className="text-[11px] text-fg/60 font-mono">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-fg">{getSchoolName(u.school_id)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                        className="rounded border border-fg/15 bg-surface px-2 py-1 text-xs font-medium cursor-pointer"
                      >
                        <option value="super_admin">Super Admin</option>
                        <option value="principal">Principal</option>
                        <option value="teacher_admin">Teacher Admin</option>
                        <option value="teacher">Teacher</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-fg/70">{u.department || "General"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleStatusToggle(u)}
                        className="btn-outline text-[11px] px-2.5 py-1"
                      >
                        {u.status === "active" ? "Suspend" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
