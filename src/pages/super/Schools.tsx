import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { listSchools, createSchool, updateSchool } from "@/services/tenant";
import { useTenant } from "@/lib/tenant";
import { useToast, Spinner, StatusBadge } from "@/components/ui";
import type { School } from "@/types/db";

export default function SuperSchools() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#4f46e5");
  const [secondaryColor, setSecondaryColor] = useState("#06b6d4");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setDevSubdomain } = useTenant();
  const navigate = useNavigate();
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const data = await listSchools();
      setSchools(data);
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      setError("Name and slug are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const created = await createSchool({
        name,
        slug,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
      });
      toast("success", `Created school tenant: ${created.name}`);
      setModalOpen(false);
      setName("");
      setSlug("");
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (school: School) => {
    try {
      await updateSchool(school.id, { is_active: !school.is_active });
      toast("success", `${school.name} is now ${!school.is_active ? "active" : "deactivated"}.`);
      load();
    } catch (err) {
      toast("error", (err as Error).message);
    }
  };

  const handleEnterSchool = (s: School) => {
    // Switch tenant context preserving super_admin actor
    setDevSubdomain(s.slug);
    toast("info", `Entered ${s.name} as Super Administrator (Audited).`);
    navigate("/admin/dashboard");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Schools Directory</h1>
          <p className="text-sm text-fg/60">
            Global management of isolated school tenants and subdomains
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary text-sm flex items-center gap-2">
          <span>+ Add New School</span>
        </button>
      </div>

      {loading ? (
        <div className="card p-12 flex justify-center">
          <Spinner label="Loading schools directory…" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {schools.map((s) => (
            <div
              key={s.id}
              className="card p-5 border border-fg/10 flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: s.primary_color || "#4f46e5" }}
                    />
                    <h3 className="font-bold text-base text-fg">{s.name}</h3>
                  </div>
                  <StatusBadge status={s.is_active ? "active" : "deactivated"} />
                </div>

                <div className="space-y-1.5 text-xs text-fg/70 bg-surface/50 p-3 rounded-lg mb-4">
                  <div className="flex justify-between">
                    <span className="text-fg/50">Subdomain:</span>
                    <span className="font-mono text-fg font-medium">{s.slug}.kairo.com</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-fg/50">Tenant ID:</span>
                    <span className="font-mono text-[11px] truncate max-w-[140px]">{s.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-fg/50">AI Assistant:</span>
                    <span className={s.settings?.ai_enabled ? "text-emerald-600 font-medium" : "text-fg/40"}>
                      {s.settings?.ai_enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-fg/50">Biometric Auth:</span>
                    <span className={s.settings?.face_auth_enabled ? "text-emerald-600 font-medium" : "text-fg/40"}>
                      {s.settings?.face_auth_enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-fg/5">
                <button
                  onClick={() => handleEnterSchool(s)}
                  className="btn-primary text-xs flex-1 py-1.5"
                >
                  Enter School Environment →
                </button>
                <button
                  onClick={() => handleToggleActive(s)}
                  className="btn-outline text-xs px-2.5 py-1.5"
                  title="Toggle activation"
                >
                  {s.is_active ? "Suspend" : "Activate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create School Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md p-6 bg-bg shadow-2xl relative">
            <h2 className="text-lg font-bold text-fg mb-1">Create School Tenant</h2>
            <p className="text-xs text-fg/60 mb-4">
              Provisions an isolated subdomain, tenant identifier, and security realm.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-fg mb-1">School Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cambridge Academy"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slug) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""));
                    }
                  }}
                  className="w-full rounded-lg border border-fg/15 bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-fg mb-1">
                  Subdomain Identifier
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    required
                    placeholder="e.g. cambridge"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    className="w-full rounded-l-lg border border-fg/15 bg-surface px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <span className="bg-surface/80 border border-l-0 border-fg/15 px-3 py-2 text-xs font-mono text-fg/60 rounded-r-lg">
                    .kairo.com
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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

              {error && <p className="text-xs text-danger font-medium">{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-outline text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs"
                >
                  {submitting ? "Provisioning…" : "Provision School"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
