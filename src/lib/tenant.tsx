import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import type { School } from "@/types/db";
import { supabase } from "./supabase";
import SchoolNotFound from "@/pages/public/SchoolNotFound";

/**
 * Resolved tenant metadata from hostname / environment.
 */
export interface TenantContextValue {
  subdomain: string | null;      // 'royal', 'oxford', or null if on main domain
  isMainDomain: boolean;         // true if on kairo.com (or root platform in dev)
  school: School | null;         // School entity loaded for the current subdomain
  loading: boolean;
  error: string | null;
  setDevSubdomain: (subdomain: string | null) => void;
  refreshTenant: () => Promise<void>;
}

// Default fallback schools for preview / mock mode
export const DEFAULT_SCHOOLS: Record<string, School> = {
  royal: {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Royal School",
    slug: "royal",
    domain: "royal.kairo.com",
    is_active: true,
    logo_url: null,
    primary_color: "#4f46e5",
    secondary_color: "#06b6d4",
    settings: {
      ai_enabled: true,
      face_auth_enabled: true,
      teacher_admin_enabled: true,
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  oxford: {
    id: "00000000-0000-0000-0000-000000000002",
    name: "Oxford School",
    slug: "oxford",
    domain: "oxford.kairo.com",
    is_active: true,
    logo_url: null,
    primary_color: "#0284c7",
    secondary_color: "#10b981",
    settings: {
      ai_enabled: true,
      face_auth_enabled: false,
      teacher_admin_enabled: true,
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

/**
 * Extract subdomain from hostname.
 * Examples:
 *   "royal.kairo.com" -> "royal"
 *   "greenfield.kairo.com" -> "greenfield"
 *   "kairo.com" -> null
 *   "www.kairo.com" -> null
 *   "royal.localhost" -> "royal"
 *   "localhost" -> null (unless in local dev mode)
 */
export function extractSubdomain(hostname: string): string | null {
  const host = hostname.toLowerCase().split(":")[0].trim();

  // Localhost subdomains (e.g., royal.localhost)
  if (host.endsWith(".localhost")) {
    const parts = host.split(".");
    if (parts.length >= 2 && parts[0] !== "www") {
      return parts[0];
    }
    return null;
  }

  // Pure IP addresses are not subdomains
  const isIpv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(host);
  if (isIpv4) {
    return null;
  }

  // Reserved platform subdomains
  const reservedPrefixes = new Set([
    "www", "app", "api", "admin", "platform", "console", "status", "mail", "auth"
  ]);

  // Production or custom multi-part domains (*.kairo.com, *.kairo.in, etc.)
  const parts = host.split(".");
  if (parts.length >= 3) {
    // If hosted on vercel preview e.g. project-git-branch.vercel.app
    if (host.endsWith(".vercel.app") && parts.length === 3) {
      // Standard vercel project root (e.g., kairo.vercel.app)
      return null;
    }

    const sub = parts[0];
    if (!reservedPrefixes.has(sub)) {
      return sub;
    }
  }

  // In local development ONLY (localhost or 127.0.0.1 or dev mode),
  // allow query param (?school=slug or ?subdomain=slug) or session storage for manual testing.
  // In production, query parameter overrides MUST be ignored to prevent cross-tenant parameter tampering.
  const isLocalDev =
    typeof window !== "undefined" &&
    (host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost") || !import.meta.env.PROD);

  if (isLocalDev && typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const paramSub = params.get("school") || params.get("subdomain");
    if (paramSub) return paramSub.toLowerCase().trim();

    const stored = sessionStorage.getItem("kairo_dev_subdomain");
    if (stored) return stored.toLowerCase().trim();
  }

  return null;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [subdomain, setSubdomain] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return extractSubdomain(window.location.hostname);
  });
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchool = async (slug: string | null) => {
    if (!slug) {
      setSchool(null);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Query Supabase schools table dynamically by slug or domain
      if (supabase) {
        const hostname = typeof window !== "undefined" ? window.location.hostname.toLowerCase() : "";
        const { data, error: err } = await supabase
          .from("schools")
          .select("*")
          .or(`slug.eq.${slug},domain.eq.${hostname}`)
          .eq("is_active", true)
          .maybeSingle();

        if (err) {
          console.warn("Could not query schools from Supabase:", err);
        }

        if (data) {
          setSchool(data as School);
          setLoading(false);
          return;
        }
      }

      // 2. In local development or mock preview mode only: fallback to default mock schools
      if (!import.meta.env.PROD && DEFAULT_SCHOOLS[slug]) {
        setSchool(DEFAULT_SCHOOLS[slug]);
        setLoading(false);
        return;
      }

      // 3. School does not exist or is inactive in production
      setSchool(null);
      setError("SCHOOL_NOT_FOUND");
    } catch (e) {
      console.error("Tenant resolution error:", e);
      setSchool(null);
      setError("SCHOOL_NOT_FOUND");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchool(subdomain);
  }, [subdomain]);

  const setDevSubdomain = (newSub: string | null) => {
    if (newSub) {
      sessionStorage.setItem("kairo_dev_subdomain", newSub);
    } else {
      sessionStorage.removeItem("kairo_dev_subdomain");
    }
    setSubdomain(newSub);
  };

  const value = useMemo<TenantContextValue>(() => ({
    subdomain,
    isMainDomain: !subdomain,
    school,
    loading,
    error,
    setDevSubdomain,
    refreshTenant: async () => {
      await fetchSchool(subdomain);
    },
  }), [subdomain, school, loading, error]);

  // Loading state when resolving tenant on a school subdomain
  if (loading && subdomain) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg text-fg">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-xs text-muted font-medium">Resolving school tenant...</p>
        </div>
      </div>
    );
  }

  // Handle unregistered or unknown school subdomains with dedicated error page
  if (!loading && subdomain && error === "SCHOOL_NOT_FOUND") {
    return <SchoolNotFound subdomain={subdomain} onReset={() => setDevSubdomain(null)} />;
  }

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    // Graceful fallback for non-provider test scenarios
    return {
      subdomain: null,
      isMainDomain: true,
      school: null,
      loading: false,
      error: null,
      setDevSubdomain: () => {},
      refreshTenant: async () => {},
    };
  }
  return ctx;
}
