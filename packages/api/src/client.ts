import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export type SupabaseConfig = {
  url: string;
  anonKey: string;
};

export function createClient(config: SupabaseConfig) {
  return createSupabaseClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
}

export type SupabaseClient = ReturnType<typeof createClient>;
