import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import type { School } from "@/types/db";
import { supabase } from "./supabase";

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
 *   "oxford.kairo.com" -> "oxford"
 *   "kairo.com" -> null
 *   "www.kairo.com" -> null
 *   "royal.localhost" -> "royal"
 *   "localhost" -> null (unless dev override stored/query)
 */
export function extractSubdomain(hostname: string): string | null {
  const host = hostname.toLowerCase().split(":")[0];

  // Specific check for *.localhost
  if (host.endsWith(".localhost")) {
    const parts = host.split(".");
    if (parts.length >= 2 && parts[0] !== "www") {
      return parts[0];
    }
  }

  // Check for *.kairo.com or multi-part domain
  const parts = host.split(".");
  if (parts.length >= 3) {
    const sub = parts[0];
    if (sub !== "www" && sub !== "app") {
      return sub;
    }
  }

  // Development query override e.g. ?school=royal or ?subdomain=royal
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const paramSub = params.get("school") || params.get("subdomain");
    if (paramSub) return paramSub.toLowerCase();

    // Session dev override
    const stored = sessionStorage.getItem("kairo_dev_subdomain");
    if (stored) return stored;
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
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (supabase) {
        const { data, error: err } = await supabase
          .from("schools")
          .select("*")
          .eq("slug", slug)
          .maybeSingle();

        if (err) {
          console.warn("Could not query schools from Supabase, checking fallback:", err);
        }

        if (data) {
          setSchool(data as School);
          setLoading(false);
          return;
        }
      }

      // Check default fallback
      if (DEFAULT_SCHOOLS[slug]) {
        setSchool(DEFAULT_SCHOOLS[slug]);
      } else {
        // Dynamic placeholder for any new slug
        setSchool({
          id: `school-${slug}`,
          name: `${slug.charAt(0).toUpperCase() + slug.slice(1)} School`,
          slug,
          domain: `${slug}.kairo.com`,
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
        });
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // fetchSchool() is async and only sets state after awaiting — not a synchronous render cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
