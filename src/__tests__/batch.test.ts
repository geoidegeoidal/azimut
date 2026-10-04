import { describe, expect, it, vi } from "vitest";
import { geocodeBatch, cancel, pause } from "../engine/geocoder.worker";
import { geocodeWithRetry } from "../engine/geocoder";
import { normalize } from "../engine/normalizer";

vi.mock("../engine/geocoder", async importOriginal => {
  const original = await importOriginal<typeof import("../engine/geocoder")>();
  return { ...original, geocodeWithRetry: vi.fn() };
});

describe("Batch cancellation preserves completed rows", () => {
  const found = { lat: -33.45, lon: -70.67, score: 78, precision: "bueno" as const, matchType: "interpolated", importance: 0,
    api: "IDE", displayName: "Prueba 101", found: true, completeness: 78, uniqueness: 100, timestamp: Date.now() };
  it("publishes each completed row before a later request is aborted", async () => {
    const controller = new AbortController();
    vi.mocked(geocodeWithRetry).mockReset().mockResolvedValueOnce(found).mockImplementationOnce(async () => { controller.abort(); throw controller.signal.reason; });
    const onResult = vi.fn();
    const results = await geocodeBatch([101, 103, 105].map(n => normalize(`Prueba ${n}`)), vi.fn(), controller.signal, onResult);
    expect(results[0]).toEqual(found);
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith(0, found);
    expect(geocodeWithRetry).toHaveBeenCalledTimes(2);
  });
  it("does not send another request after cancellation while paused", async () => {
    const controller = new AbortController();
    vi.mocked(geocodeWithRetry).mockReset().mockResolvedValue(found);
    await geocodeBatch([101, 103].map(n => normalize(`Prueba ${n}`)), () => { pause(); cancel(); }, controller.signal);
    expect(geocodeWithRetry).toHaveBeenCalledTimes(1);
  });
});
