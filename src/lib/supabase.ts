import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { oauthPkceStorage } from "@/lib/oauthPkceStorage";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: "pkce",
        persistSession: false,
        detectSessionInUrl: false,
        storage: oauthPkceStorage,
      },
    });
  }
  return client;
}
