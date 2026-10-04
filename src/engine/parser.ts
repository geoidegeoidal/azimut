import Papa from "papaparse";

export interface ParseResult {
  headers: string[];
  data: Record<string, string>[];
  fileName: string;
  rowCount: number;
  encoding: string;
  delimiter?: string;
}

export interface ParseError {
  type: "encoding" | "format" | "empty" | "structure";
  message: string;
}

const ADDRESS_KEYWORDS = [
  "direccion", "dirección", "address", "calle", "ubicacion",
  "ubicación", "domicilio", "dir", "addr",
];

function detectEncodingFromBytes(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return "UTF-8-BOM";
  }
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return "UTF-16BE";
  }
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return "UTF-16LE";
  }
  try { new TextDecoder("utf-8", { fatal: true }).decode(buffer); return "UTF-8"; }
  catch { return "Latin1"; }
}

function decodeText(buffer: ArrayBuffer, encoding: string): string {
  if (encoding === "UTF-16BE" || encoding === "UTF-16LE") {
    const decoder = new TextDecoder(encoding === "UTF-16BE" ? "utf-16be" : "utf-16le");
    return decoder.decode(buffer);
  }
  if (encoding === "Latin1") {
    const decoder = new TextDecoder("windows-1252");
    return decoder.decode(buffer);
  }
  const decoder = new TextDecoder("utf-8");
  return decoder.decode(buffer);
}

function detectDelimiter(text: string): string {
  const firstLine = text.split("\n")[0] || "";
  const counts: Record<string, number> = { ",": 0, ";": 0, "\t": 0, "|": 0 };
  for (const ch of firstLine) {
    if (ch in counts) counts[ch]++;
  }
  const max = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (max[1] === 0) return ",";
  return max[0];
}

function cleanHeaders(values: unknown[]): string[] {
  const headers = values.map(value => String(value ?? "").trim().toLowerCase());
  if (headers.some(h => !h) || new Set(headers).size !== headers.length) throw { type: "structure", message: "Usa encabezados distintos y no vacíos." } satisfies ParseError;
  return headers;
}

export function parseCSVBuffer(buffer: ArrayBuffer, fileName: string): ParseResult {
  const encoding = detectEncodingFromBytes(buffer);
  const parsed = Papa.parse<string[]>(decodeText(buffer, encoding), { skipEmptyLines: "greedy", delimitersToGuess: [",", ";", "\t", "|"] });
  if (parsed.errors.some(e => e.code === "MissingQuotes")) throw { type: "format", message: "El CSV tiene comillas sin cerrar." } satisfies ParseError;
  if (parsed.data.length < 2) throw { type: "empty", message: "El archivo está vacío o no tiene datos." } satisfies ParseError;
  const headers = cleanHeaders(parsed.data[0]);
  if (parsed.data.slice(1).some(values => values.length > headers.length)) throw { type: "structure", message: "Hay filas con más campos que encabezados. Revisa el separador y las comillas del CSV." } satisfies ParseError;
  const data = parsed.data.slice(1).map(values => Object.fromEntries(headers.map((header, i) => [header, (values[i] || "").trim()])));
  return { headers, data, fileName, rowCount: data.length, encoding, delimiter: parsed.meta.delimiter || detectDelimiter(decodeText(buffer, encoding)) };
}

export async function parseCSV(file: File): Promise<ParseResult> {
  return parseCSVBuffer(await file.arrayBuffer(), file.name);
}

export async function parseXLSXBuffer(buffer: ArrayBuffer, fileName: string): Promise<ParseResult> {
  const XLSX = await import("xlsx");
  let cells: unknown[][];
  try {
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    cells = sheet ? XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", blankrows: false, raw: false }) : [];
  } catch { throw { type: "format", message: "No se pudo leer el archivo XLSX." } satisfies ParseError; }
  if (cells.length < 2) throw { type: "empty", message: "La hoja está vacía o no tiene datos." } satisfies ParseError;
  const headers = cleanHeaders(cells[0]);
  const data = cells.slice(1).map(row => Object.fromEntries(headers.map((header, i) => [header, String(row[i] ?? "").trim()])));
  return { headers, data, fileName, rowCount: data.length, encoding: "UTF-8" };
}

export async function parseXLSX(file: File): Promise<ParseResult> {
  return parseXLSXBuffer(await file.arrayBuffer(), file.name);
}

export function detectAddressColumn(headers: string[]): string | null {
  for (const keyword of ADDRESS_KEYWORDS) {
    for (const header of headers) {
      if (header.toLowerCase().includes(keyword)) {
        return header;
      }
    }
  }
  return null;
}

export function validateFile(file: File): ParseError | null {
  const name = file.name.toLowerCase();
  const ext = name.split(".").pop();
  if (!ext || !["csv", "xlsx", "xls"].includes(ext)) {
    return {
      type: "format",
      message: "Formato no soportado. Usa un archivo CSV o XLSX.",
    };
  }
  if (file.size === 0) {
    return { type: "empty", message: "El archivo está vacío." };
  }
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      type: "format",
      message: "El archivo es muy grande (máx. 50 MB).",
    };
  }
  return null;
}
