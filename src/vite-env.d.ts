/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** DEV ONLY: "1" enables a mock login when Supabase is unconfigured. */
  readonly VITE_DEV_AUTH?: string;
}
interface ImportMeta { readonly env: ImportMetaEnv }
