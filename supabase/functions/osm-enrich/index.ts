import { fetchOSM, overpassQuery } from "../../../server/osm-query.mjs";

const base = Deno.env.get("SUPABASE_URL")!;
const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const dbHeaders = { apikey: secret, Authorization: `Bearer ${secret}`, "Content-Type": "application/json" };
const cors = { "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };
async function rpc(name: string, body: Record<string, unknown>) {
  const response = await fetch(`${base}/rest/v1/rpc/${name}`, { method: "POST", headers: dbHeaders, body: JSON.stringify(body), signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error("Database unavailable");
  return response.json();
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "POST") return Response.json({ error: "POST required" }, { status: 405, headers: cors });
  try {
    const authorization = request.headers.get("Authorization") || "";
    if (!authorization.startsWith("Bearer ")) return Response.json({ error: "Authentication required" }, { status: 401, headers: cors });
    const auth = await fetch(`${base}/auth/v1/user`, { headers: { apikey: secret, Authorization: authorization }, signal: AbortSignal.timeout(5000) });
    if (!auth.ok) return Response.json({ error: "Invalid session" }, { status: 401, headers: cors });
    const user = await auth.json();
    if (!user.id) return Response.json({ error: "Invalid user" }, { status: 401, headers: cors });
    const body = await request.text();
    if (body.length > 4096) return Response.json({ error: "Request too large" }, { status: 413, headers: cors });
    const input = JSON.parse(body);
    let query: string;
    try { query = overpassQuery(input); } catch (error) { return Response.json({ error: String(error) }, { status: 400, headers: cors }); }
    const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(query));
    const key = [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, "0")).join("");
    const cached = await fetch(`${base}/rest/v1/azimut_osm_cache?key=eq.${key}&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=payload`, { headers: dbHeaders });
    if (!cached.ok) throw new Error("Cache unavailable");
    const rows = await cached.json();
    let data = rows[0]?.payload;
    const limited = () => Response.json({ error: "Límite de enriquecimiento alcanzado. Se conservan las otras fuentes." }, { status: 429, headers: { ...cors, "Retry-After": "2" } });
    if (!data) {
      if (!await rpc("admit_osm_request", { p_user_id: user.id, p_miss: true })) return limited();
      data = await fetchOSM(input);
      await rpc("store_osm_cache", { p_key: key, p_payload: data });
    }
    const payload = JSON.stringify(data), bytes = new TextEncoder().encode(payload).length;
    if (!await rpc("admit_osm_request", { p_user_id: user.id, p_miss: false, p_bytes: bytes })) return limited();
    return new Response(payload, { headers: { ...cors, "Content-Type": "application/json" } });
  } catch {
    return Response.json({ error: "No se pudo consultar OSM. Se conservan las otras fuentes." }, { status: 502, headers: cors });
  }
});
