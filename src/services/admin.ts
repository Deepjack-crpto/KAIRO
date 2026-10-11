import { requireSupabase } from "@/lib/supabase";
import type { AuditLog } from "@/types/db";

/**
 * Admin-only server operations go through the `admin` Edge Function, which runs
 * with the service role and re-verifies the caller is an admin. The browser
 * never holds the service-role key.
 */
async function invokeAdmin<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  const sb = requireSupabase();
  const { data, error } = await sb.functions.invoke("admin", { body: { action, ...payload } });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data as T;
}

export const inviteTeacher = (email: string, fullName: string) =>
  invokeAdmin<{ ok: true; invited: string }>("invite_teacher", { email, fullName });

export const resendInvite = (email: string) =>
  invokeAdmin<{ ok: true }>("resend_invite", { email });

export const setTeacherStatus = (
  teacherId: string,
  status: "active" | "suspended" | "deactivated",
) => invokeAdmin<{ ok: true }>("set_status", { teacherId, status });

export const sendPasswordRecovery = (email: string) =>
  invokeAdmin<{ ok: true }>("password_recovery", { email });

// ---- super-admin only: manage administrators ------------------------------
export const inviteAdmin = (email: string, fullName: string) =>
  invokeAdmin<{ ok: true; invited: string }>("invite_admin", { email, fullName });

/** Change any account's status (super admin may target admins too). */
export const setUserStatus = (
  userId: string,
  status: "active" | "suspended" | "deactivated",
) => invokeAdmin<{ ok: true }>("set_status", { userId, status });

/** Promote/demote an account. Super admin only. */
export const setUserRole = (
  userId: string,
  role: "super_admin" | "admin" | "teacher",
) => invokeAdmin<{ ok: true }>("set_role", { userId, role });

export async function listAudit(limit = 50): Promise<AuditLog[]> {
  const { data, error } = await requireSupabase()
    .from("audit_logs").select("*").order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return data as AuditLog[];
}

export interface AdminMetrics {
  teachers: number; active: number; suspended: number;
  classes: number; sections: number; assignments: number;
  materialsPublished: number; processing: number;
  activities: number; worksheets: number; quizzes: number;
}

/** Real DB-backed dashboard counts (no hardcoded metrics). */
export async function adminMetrics(): Promise<AdminMetrics> {
  const sb = requireSupabase();
  const count = async (table: string, filter?: (q: any) => any) => {
    let q = sb.from(table).select("*", { count: "exact", head: true });
    if (filter) q = filter(q);
    const { count: c, error } = await q;
    if (error) throw error;
    return c ?? 0;
  };
  const [teachers, active, suspended, classes, sections, assignments, materialsPublished, processing, activities, worksheets, quizzes] =
    await Promise.all([
      count("profiles", (q) => q.eq("role", "teacher")),
      count("profiles", (q) => q.eq("role", "teacher").eq("status", "active")),
      count("profiles", (q) => q.eq("role", "teacher").eq("status", "suspended")),
      count("classes"),
      count("sections"),
      count("teacher_assignments", (q) => q.eq("is_revoked", false)),
      count("curriculum_materials", (q) => q.eq("is_published", true)),
      count("curriculum_materials", (q) => q.eq("status", "processing")),
      count("activities"),
      count("worksheets"),
      count("quizzes"),
    ]);
  return { teachers, active, suspended, classes, sections, assignments, materialsPublished, processing, activities, worksheets, quizzes };
}
