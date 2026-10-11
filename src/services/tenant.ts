import { requireSupabase, supabase } from "@/lib/supabase";
import type { School } from "@/types/db";
import { DEFAULT_SCHOOLS } from "@/lib/tenant";

/**
 * Super Admin: List all schools across the platform
 */
export async function listSchools(): Promise<School[]> {
  if (!supabase) {
    return Object.values(DEFAULT_SCHOOLS);
  }
  const { data, error } = await supabase
    .from("schools")
    .select("*")
    .order("name", { ascending: true });
  if (error) {
    console.warn("Falling back to default schools:", error.message);
    return Object.values(DEFAULT_SCHOOLS);
  }
  return data as School[];
}

/**
 * Super Admin: Create a new school tenant
 */
export async function createSchool(payload: {
  name: string;
  slug: string;
  domain?: string;
  primary_color?: string;
  secondary_color?: string;
}): Promise<School> {
  const sb = requireSupabase();
  const slug = payload.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  const domain = payload.domain || `${slug}.kairo.com`;

  const { data, error } = await sb
    .from("schools")
    .insert({
      name: payload.name.trim(),
      slug,
      domain,
      primary_color: payload.primary_color || "#4f46e5",
      secondary_color: payload.secondary_color || "#06b6d4",
      is_active: true,
      settings: {
        ai_enabled: true,
        face_auth_enabled: true,
        teacher_admin_enabled: true,
      },
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  // Register domain
  await sb.from("school_domains").insert({
    school_id: data.id,
    hostname: domain,
    is_primary: true,
  });

  return data as School;
}

/**
 * Update school details or settings
 */
export async function updateSchool(
  id: string,
  updates: Partial<Pick<School, "name" | "is_active" | "primary_color" | "secondary_color" | "settings" | "logo_url">>
): Promise<School> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("schools")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as School;
}
