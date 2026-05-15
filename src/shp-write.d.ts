declare module "@crmackey/shp-write" {
  interface ShpWriteOptions {
    name?: string;
    folder?: string;
    types?: Record<string, string>;
  }
  function download(
    geojson: Record<string, unknown>,
    options?: ShpWriteOptions,
  ): void;
  function write(
    geojson: Record<string, unknown>,
    options?: ShpWriteOptions,
  ): Promise<Blob>;
  function zip(
    geojson: Record<string, unknown>,
    options?: ShpWriteOptions,
  ): Promise<Blob>;
}
