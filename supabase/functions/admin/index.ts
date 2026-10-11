// admin — privileged operations. Runs with the service role, but EVERY request
// re-verifies the caller is an active admin (client role claims are not trusted).
import { json, preflight } from "../_shared/cors.ts";
import {
  audit,
  HttpError,
  requireAdmin,
  serviceClient,
} from "../_shared/auth.ts";

const STATUSES = new Set(["active", "suspended", "deactivated"]);
const ROLES = new Set(["super_admin", "admin", "teacher"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight();
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  let svc;
  try {
    svc = serviceClient();
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }

  try {
    const admin = await requireAdmin(req, svc);
    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "");

    switch (action) {
      case "invite_teacher": {
        const email = String(body.email ?? "").trim().toLowerCase();
        const fullName = String(body.fullName ?? "").trim();
        if (!EMAIL_RE.test(email)) throw new HttpError(400, "A valid email is required.");
        if (!fullName) throw new HttpError(400, "Teacher name is required.");

        const redirectTo = Deno.env.get("INVITE_REDIRECT_URL") ?? undefined;
        const { data: invited, error } = await svc.auth.admin.inviteUserByEmail(email, {
          data: { full_name: fullName, role: "teacher" },
          redirectTo,
        });
        if (error) throw new HttpError(400, error.message);

        const userId = invited.user?.id;
        if (userId) {
          // Upsert the profile with the server-controlled role. Never trust the client.
          await svc.from("profiles").upsert(
            { id: userId, email, full_name: fullName, role: "teacher", status: "active" },
            { onConflict: "id" },
          );
        }
        await svc.from("invitations").insert({
          email,
          full_name: fullName,
          role: "teacher",
          token_hash: "sent-via-supabase-auth",
          expires_at: new Date(Date.now() + 7 * 864e5).toISOString(),
          created_by: admin.id,
        });
        await audit(svc, admin.id, "teacher.invite", email, { fullName });
        return json({ ok: true, invited: email });
      }

      case "resend_invite": {
        const email = String(body.email ?? "").trim().toLowerCase();
        if (!EMAIL_RE.test(email)) throw new HttpError(400, "A valid email is required.");
        const redirectTo = Deno.env.get("INVITE_REDIRECT_URL") ?? undefined;
        const { error } = await svc.auth.admin.inviteUserByEmail(email, { redirectTo });
        if (error) throw new HttpError(400, error.message);
        await audit(svc, admin.id, "teacher.resend_invite", email, {});
        return json({ ok: true });
      }

      case "set_status": {
        const targetId = String(body.teacherId ?? body.userId ?? "");
        const status = String(body.status ?? "");
        if (!STATUSES.has(status)) throw new HttpError(400, "Invalid status.");
        const { data: target } = await svc
          .from("profiles").select("id,role").eq("id", targetId).single();
        if (!target) throw new HttpError(404, "Account not found.");

        const isSuper = admin.role === "super_admin";
        // Principals may only change teachers. Super admins may change anyone
        // but themselves (guards against locking out the last super admin).
        if (!isSuper && target.role !== "teacher") {
          throw new HttpError(403, "Only teacher accounts can be changed here.");
        }
        if (isSuper && target.id === admin.id) {
          throw new HttpError(400, "You cannot change your own status.");
        }

        const { error } = await svc.from("profiles").update({ status }).eq("id", targetId);
        if (error) throw new HttpError(400, error.message);
        // Revoke refresh tokens so a suspended/deactivated account loses access immediately.
        if (status !== "active") {
          await svc.auth.admin.signOut(targetId, "global").catch(() => {});
        }
        await audit(svc, admin.id, "account.set_status", targetId, { status, role: target.role });
        return json({ ok: true });
      }

      case "invite_admin": {
        if (admin.role !== "super_admin") {
          throw new HttpError(403, "Super administrator access required.");
        }
        const email = String(body.email ?? "").trim().toLowerCase();
        const fullName = String(body.fullName ?? "").trim();
        if (!EMAIL_RE.test(email)) throw new HttpError(400, "A valid email is required.");
        if (!fullName) throw new HttpError(400, "Administrator name is required.");

        const redirectTo = Deno.env.get("INVITE_REDIRECT_URL") ?? undefined;
        const { data: invited, error } = await svc.auth.admin.inviteUserByEmail(email, {
          data: { full_name: fullName, role: "admin" },
          redirectTo,
        });
        if (error) throw new HttpError(400, error.message);

        const userId = invited.user?.id;
        if (userId) {
          await svc.from("profiles").upsert(
            { id: userId, email, full_name: fullName, role: "admin", status: "active" },
            { onConflict: "id" },
          );
        }
        await svc.from("invitations").insert({
          email,
          full_name: fullName,
          role: "admin",
          token_hash: "sent-via-supabase-auth",
          expires_at: new Date(Date.now() + 7 * 864e5).toISOString(),
          created_by: admin.id,
        });
        await audit(svc, admin.id, "admin.invite", email, { fullName });
        return json({ ok: true, invited: email });
      }

      case "set_role": {
        if (admin.role !== "super_admin") {
          throw new HttpError(403, "Super administrator access required.");
        }
        const targetId = String(body.userId ?? "");
        const role = String(body.role ?? "");
        if (!ROLES.has(role)) throw new HttpError(400, "Invalid role.");
        if (targetId === admin.id) throw new HttpError(400, "You cannot change your own role.");
        const { data: target } = await svc
          .from("profiles").select("id,role").eq("id", targetId).single();
        if (!target) throw new HttpError(404, "Account not found.");

        const { error } = await svc.from("profiles").update({ role }).eq("id", targetId);
        if (error) throw new HttpError(400, error.message);
        // Changing role may add/drop privileges — force re-auth to re-derive them.
        await svc.auth.admin.signOut(targetId, "global").catch(() => {});
        await audit(svc, admin.id, "admin.set_role", targetId, { from: target.role, to: role });
        return json({ ok: true });
      }

      case "password_recovery": {
        const email = String(body.email ?? "").trim().toLowerCase();
        if (!EMAIL_RE.test(email)) throw new HttpError(400, "A valid email is required.");
        const redirectTo = Deno.env.get("RECOVERY_REDIRECT_URL") ?? undefined;
        const { error } = await svc.auth.admin.generateLink({
          type: "recovery",
          email,
          options: redirectTo ? { redirectTo } : undefined,
        });
        if (error) throw new HttpError(400, error.message);
        await audit(svc, admin.id, "teacher.password_recovery", email, {});
        return json({ ok: true });
      }

      default:
        throw new HttpError(400, `Unknown action: ${action || "(none)"}`);
    }
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    return json({ error: (e as Error).message }, status);
  }
});
