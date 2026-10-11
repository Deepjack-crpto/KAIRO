import { useTenant } from "@/lib/tenant";
import { useAuth } from "@/features/auth/AuthContext";

export function TenantBar() {
  const { subdomain, school, setDevSubdomain } = useTenant();
  const { profile } = useAuth();

  return (
    <div className="bg-fg/95 text-bg px-4 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-fg/10 select-none">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-semibold tracking-wide">
          {school ? (
            <>
              TENANT: <span className="text-emerald-300 font-bold">{school.name}</span>{" "}
              <span className="opacity-70">({school.slug}.kairo.com)</span>
            </>
          ) : (
            <>
              PLATFORM DOMAIN: <span className="text-blue-300 font-bold">kairo.com</span>{" "}
              <span className="opacity-70">(Global Main Layer)</span>
            </>
          )}
        </span>
        {profile && (
          <span className="hidden sm:inline-block opacity-60">
            | Actor: {profile.full_name} ({profile.role.toUpperCase()})
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="opacity-70 hidden md:inline">Switch Tenant Context:</span>
        <select
          value={subdomain || "main"}
          onChange={(e) => {
            const val = e.target.value === "main" ? null : e.target.value;
            setDevSubdomain(val);
          }}
          className="bg-fg/80 text-bg border border-bg/20 rounded px-2 py-0.5 text-xs font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="main">🌐 Main Platform (kairo.com)</option>
          <option value="royal">🏫 Royal School (royal.kairo.com)</option>
          <option value="oxford">🎓 Oxford School (oxford.kairo.com)</option>
        </select>
      </div>
    </div>
  );
}
