import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

it.each([
  { configured: true, detail: "Indica una comuna para consultar el índice espacial" },
  { configured: false, detail: "Backend sin configurar" },
])("explains why PostGIS was skipped when configured=$configured", async ({ configured, detail }) => {
  vi.resetModules();
  vi.stubEnv("VITE_SUPABASE_URL", configured ? "https://example.supabase.co" : "");
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", configured ? "test-public-key" : "");
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", "");
  const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ features: [] }) });
  vi.stubGlobal("fetch", fetch);
  const { geocodeWithFallback } = await import("../engine/geocoder");
  const result = await geocodeWithFallback("Romero 2349", new AbortController().signal);
  expect(result.sources).toContainEqual({ source: "Supabase / PostGIS", status: "disabled", detail });
  expect(fetch.mock.calls.some(([url]) => String(url).includes("/rest/v1/rpc/"))).toBe(false);
});
