import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/features/auth/AuthContext";
import { useTenant } from "@/lib/tenant";
import { updateSchool } from "@/services/tenant";
import { getSchoolAIConfig, updateSchoolAIConfig } from "@/services/aiAssistant";
import { useToast } from "@/components/ui";

export default function Settings() {
  const { profile, configured } = useAuth();
  const { school, refreshTenant } = useTenant();
  const toast = useToast();

  // Editable settings
  const [schoolName, setSchoolName] = useState(school?.name || "");
  const [primaryColor, setPrimaryColor] = useState(school?.primary_color || "#4f46e5");
  const [secondaryColor, setSecondaryColor] = useState(school?.secondary_color || "#06b6d4");

  // Feature Flags
  const [aiEnabled, setAiEnabled] = useState(school?.settings?.ai_enabled ?? true);
  const [faceAuthEnabled, setFaceAuthEnabled] = useState(school?.settings?.face_auth_enabled ?? true);
  const [teacherAdminEnabled, setTeacherAdminEnabled] = useState(school?.settings?.teacher_admin_enabled ?? true);

  // AI Config
  const [allowTeacherKeys, setAllowTeacherKeys] = useState(true);
  const [saving, setSaving] = useState(false);

  // Seed the editable form fields from the loaded school record.
  useEffect(() => {
    if (school) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setSchoolName(school.name);
      setPrimaryColor(school.primary_color);
      setSecondaryColor(school.secondary_color);
      setAiEnabled(school.settings.ai_enabled);
      setFaceAuthEnabled(school.settings.face_auth_enabled);
      setTeacherAdminEnabled(school.settings.teacher_admin_enabled);
      /* eslint-enable react-hooks/set-state-in-effect */

      getSchoolAIConfig(school.id).then((cfg) => {
        if (cfg) {
          setAllowTeacherKeys(cfg.allow_teacher_keys);
        }
      });
    }
  }, [school]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school) return;
    setSaving(true);
    try {
      // 1. Update school settings
      await updateSchool(school.id, {
        name: schoolName,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        settings: {
          ai_enabled: aiEnabled,
          face_auth_enabled: faceAuthEnabled,
          teacher_admin_enabled: teacherAdminEnabled,
        },
      });

      // 2. Update AI config
      await updateSchoolAIConfig(school.id, {
        allow_teacher_keys: allowTeacherKeys,
      });

      await refreshTenant();
      toast("success", "School settings updated successfully.");
    } catch (err: any) {
      toast("error", err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="School Settings & Branding"
        subtitle={`Configure branding, AI policies, and feature flags for ${school?.name || "your school"}.`}
      />

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* School Tenant Branding */}
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-base text-fg flex items-center gap-2">
              <span>🏫 School Branding & Subdomain</span>
            </h2>

            <div>
              <label className="block text-xs font-medium text-fg mb-1">Institution Name</label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full rounded-lg border border-fg/15 bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="flex justify-between items-center text-xs text-fg/60 py-1 border-y border-fg/5">
              <span>Assigned Subdomain:</span>
              <span className="font-mono text-fg font-semibold">{school?.slug}.kairo.com</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-fg mb-1">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-8 w-10 cursor-pointer rounded border border-fg/10 bg-transparent p-0"
                  />
                  <span className="text-xs font-mono">{primaryColor}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-fg mb-1">Secondary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="h-8 w-10 cursor-pointer rounded border border-fg/10 bg-transparent p-0"
                  />
                  <span className="text-xs font-mono">{secondaryColor}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Flags */}
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-base text-fg flex items-center gap-2">
              <span>🚩 School Feature Flags</span>
            </h2>
            <p className="text-xs text-fg/60">
              Control which modules are active for your teachers. Backend authorization strictly enforces these.
            </p>

            <div className="space-y-3 pt-1">
              <label className="flex items-center justify-between p-3 rounded-lg bg-surface/50 border border-fg/5 cursor-pointer">
                <div>
                  <span className="font-medium text-sm text-fg block">Teacher AI Assistant</span>
                  <span className="text-xs text-fg/50">Enable AI pedagogical assistant for teaching staff</span>
                </div>
                <input
                  type="checkbox"
                  checked={aiEnabled}
                  onChange={(e) => setAiEnabled(e.target.checked)}
                  className="rounded border-fg/20 text-accent focus:ring-accent h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg bg-surface/50 border border-fg/5 cursor-pointer">
                <div>
                  <span className="font-medium text-sm text-fg block">Biometric Face Authentication</span>
                  <span className="text-xs text-fg/50">Allow face verification for Teacher Admin workflows</span>
                </div>
                <input
                  type="checkbox"
                  checked={faceAuthEnabled}
                  onChange={(e) => setFaceAuthEnabled(e.target.checked)}
                  className="rounded border-fg/20 text-accent focus:ring-accent h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg bg-surface/50 border border-fg/5 cursor-pointer">
                <div>
                  <span className="font-medium text-sm text-fg block">Teacher Admin Role</span>
                  <span className="text-xs text-fg/50">Enable teacher administrative requests & delegations</span>
                </div>
                <input
                  type="checkbox"
                  checked={teacherAdminEnabled}
                  onChange={(e) => setTeacherAdminEnabled(e.target.checked)}
                  className="rounded border-fg/20 text-accent focus:ring-accent h-4 w-4"
                />
              </label>
            </div>
          </div>

          {/* AI Policy & Configuration */}
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-base text-fg flex items-center gap-2">
              <span>🤖 Teacher AI Configuration</span>
            </h2>
            <p className="text-xs text-fg/60">
              Approved AI provider and rate controls. Keys are encrypted server-side and never exposed to browsers.
            </p>

            <div className="space-y-3 pt-1">
              <div className="flex justify-between items-center text-xs p-2 rounded bg-surface/50">
                <span className="text-fg/60">Default Model:</span>
                <span className="font-mono text-fg font-medium">claude-sonnet-3-5 (CBSE Tuned)</span>
              </div>

              <label className="flex items-center justify-between p-3 rounded-lg bg-surface/50 border border-fg/5 cursor-pointer">
                <div>
                  <span className="font-medium text-sm text-fg block">Allow Teacher-Provided Keys</span>
                  <span className="text-xs text-fg/50">Allow teachers to supply their own API credentials if desired</span>
                </div>
                <input
                  type="checkbox"
                  checked={allowTeacherKeys}
                  onChange={(e) => setAllowTeacherKeys(e.target.checked)}
                  className="rounded border-fg/20 text-accent focus:ring-accent h-4 w-4"
                />
              </label>
            </div>
          </div>

          {/* Administrator Info & Security */}
          <div className="card p-5 space-y-3">
            <h2 className="font-semibold text-base text-fg flex items-center gap-2">
              <span>🛡️ Security & Identity Realm</span>
            </h2>
            <div className="space-y-2 text-xs text-fg/70 bg-surface/40 p-3 rounded-lg">
              <div className="flex justify-between">
                <span className="text-fg/50">Active Principal:</span>
                <span className="font-medium text-fg">{profile?.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-fg/50">Principal Email:</span>
                <span className="font-mono text-fg">{profile?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-fg/50">Backend Status:</span>
                <span className={configured ? "text-emerald-600 font-semibold" : "text-amber-600 font-semibold"}>
                  {configured ? "Supabase Postgres Connected" : "Local Dev Auth Mode"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-fg/50">Tenant Isolation Layer:</span>
                <span className="text-emerald-600 font-semibold">Active RLS Policy Pinned</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={saving} className="btn-primary text-sm px-6">
            {saving ? "Saving Changes…" : "Save School Settings"}
          </button>
        </div>
      </form>
    </>
  );
}
