import type { CallejeroSegment } from "./callejero";
import type { OSMElement } from "./osm";
import type { GeocodeCandidate } from "@/types";

const url = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
export const isSupabaseConfigured = Boolean(url && key);

let session: { access_token: string; refresh_token: string; expires_at: number } | null = null;
let signingIn: Promise<string> | null = null;
async function accessToken(signal: AbortSignal): Promise<string> {
  if (session && session.expires_at > Date.now() / 1000 + 60) return session.access_token;
  if (!signingIn) {
    signingIn = (async () => {
      const refreshing = Boolean(session?.refresh_token);
      const response = await fetch(`${url}/auth/v1/${refreshing ? "token?grant_type=refresh_token" : "signup"}`, {
        method: "POST", headers: headers(), signal,
        body: JSON.stringify(refreshing ? { refresh_token: session!.refresh_token } : { data: {} }),
      });
      if (!response.ok) { session = null; throw new Error("Habilita el acceso anónimo en Supabase para consultar OSM"); }
      const data = await response.json();
      if (!data.access_token || !data.refresh_token) throw new Error("Sesión OSM no disponible");
      session = { access_token: data.access_token, refresh_token: data.refresh_token, expires_at: data.expires_at || Date.now() / 1000 + data.expires_in };
      return session.access_token;
    })().finally(() => { signingIn = null; });
  }
  return signingIn;
}

function headers(): Record<string, string> {
  return { "Content-Type": "application/json", apikey: key || "", ...(key?.startsWith("eyJ") ? { Authorization: `Bearer ${key}` } : {}) };
}

export async function querySpatialIndex(street: string, comuna: string, number: string, signal: AbortSignal): Promise<{ segments: CallejeroSegment[]; addresses: GeocodeCandidate[] }> {
  const response = await fetch(`${url}/rest/v1/rpc/address_candidates`, { method: "POST", headers: headers(), signal,
    body: JSON.stringify({ p_street: street, p_comuna: comuna, p_number: number }) });
  if (!response.ok) throw new Error(`Índice espacial HTTP ${response.status}`);
  const data = await response.json();
  return { segments: data.segments || [], addresses: data.addresses || [] };
}

export async function queryOSMVectors(street: string, bounds: [number, number, number, number], signal: AbortSignal): Promise<OSMElement[]> {
  const endpoint = isSupabaseConfigured ? `${url}/functions/v1/osm-enrich` : import.meta.env.VITE_OSM_VECTOR_API;
  if (!endpoint) throw new Error("OSM_VECTOR_BACKEND_NOT_CONFIGURED");
  const vectorHeaders: Record<string, string> = isSupabaseConfigured ? { ...headers(), Authorization: `Bearer ${await accessToken(signal)}` } : { "Content-Type": "application/json" };
  const response = await fetch(endpoint, { method: "POST", headers: vectorHeaders, signal,
    body: JSON.stringify({ street, bounds }) });
  if (!response.ok) throw new Error(`OSM vectorial HTTP ${response.status}`);
  const data = await response.json();
  return data.elements || [];
}

export const hasVectorBackend = isSupabaseConfigured || Boolean(import.meta.env.VITE_OSM_VECTOR_API);
