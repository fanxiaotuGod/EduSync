import type { SupportedStorage } from "@supabase/supabase-js";

const OAUTH_STORAGE_TTL_SECONDS = 600;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function readCookie(name: string): string | null {
  const encoded = encodeURIComponent(name);
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${escapeRegExp(encoded)}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string): void {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=/; Max-Age=${OAUTH_STORAGE_TTL_SECONDS}; SameSite=Lax${secure}`;
}

function removeCookie(name: string): void {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${encodeURIComponent(name)}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

/** Persists PKCE verifier across OAuth redirects (localStorage alone is unreliable). */
export const oauthPkceStorage: SupportedStorage = {
  getItem(key: string) {
    return readCookie(key) ?? window.localStorage.getItem(key);
  },
  setItem(key: string, value: string) {
    writeCookie(key, value);
    window.localStorage.setItem(key, value);
  },
  removeItem(key: string) {
    removeCookie(key);
    window.localStorage.removeItem(key);
  },
};
