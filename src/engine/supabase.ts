import type { CallejeroSegment } from "./callejero";
import type { OSMElement } from "./osm";
import type { GeocodeCandidate } from "@/types";

const url = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
export const isSupabaseConfigured = Boolean(url && key);

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
  const response = await fetch(endpoint, { method: "POST", headers: isSupabaseConfigured ? headers() : { "Content-Type": "application/json" }, signal,
    body: JSON.stringify({ street, bounds }) });
  if (!response.ok) throw new Error(`OSM vectorial HTTP ${response.status}`);
  const data = await response.json();
  return data.elements || [];
}

export const hasVectorBackend = isSupabaseConfigured || Boolean(import.meta.env.VITE_OSM_VECTOR_API);
