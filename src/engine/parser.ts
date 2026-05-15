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
  let nonAscii = 0;
  let latin1 = true;
  for (let i = 0; i < Math.min(bytes.length, 1000); i++) {
    const b = bytes[i];
    if (b > 127) {
      nonAscii++;
      if (b === 0x80 || b === 0x82 || b === 0x96 || b === 0x97 ||
        b === 0x98 || b === 0x9d || b === 0x9e) {
        latin1 = false;
      }
    }
  }
  if (nonAscii > 0 && latin1) return "Latin1";
  return "UTF-8";
}

function decodeText(buffer: ArrayBuffer, encoding: string): string {
  if (encoding === "UTF-16BE" || encoding === "UTF-16LE") {
    const decoder = new TextDecoder("utf-16");
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

function splitCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSVText(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const cleaned = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = cleaned.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return { headers: [], rows: [] };
  }
  const delimiter = detectDelimiter(lines[0]);
  const headers = splitCSVLine(lines[0], delimiter).map((h) =>
    h.replace(/^["']|["']$/g, "").trim().toLowerCase(),
  );
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = splitCSVLine(lines[i], delimiter);
    const row: Record<string, string> = {};
    headers.forEach((h, j) => {
      row[h] = (values[j] || "").replace(/^["']|["']$/g, "").trim();
    });
    if (Object.values(row).some((v) => v.length > 0)) {
      rows.push(row);
    }
  }
  return { headers, rows };
}

export async function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      const encoding = detectEncodingFromBytes(buffer);
      const text = decodeText(buffer, encoding);
      const { headers, rows } = parseCSVText(text);
      if (rows.length === 0) {
        reject({ type: "empty", message: "El archivo está vacío o no tiene datos." } as ParseError);
        return;
      }
      if (headers.length === 0) {
        reject({ type: "structure", message: "No se detectaron encabezados." } as ParseError);
        return;
      }
      const delimiter = detectDelimiter(text.split("\n")[0] || "");
      resolve({
        headers,
        data: rows,
        fileName: file.name,
        rowCount: rows.length,
        encoding,
        delimiter,
      });
    };
    reader.onerror = () => reject({ type: "format", message: "No se pudo leer el archivo." } as ParseError);
    reader.readAsArrayBuffer(file);
  });
}

export async function parseXLSX(file: File): Promise<ParseResult> {
  const XLSX = await import("xlsx");
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });
        if (json.length === 0) {
          reject({ type: "empty", message: "La hoja está vacía o no tiene datos." } as ParseError);
          return;
        }
        const rawHeaders = Object.keys(json[0]);
        const cleanHeaders = rawHeaders.map((h) => h.trim().toLowerCase());
        const rows = json.map((row) => {
          const cleanRow: Record<string, string> = {};
          rawHeaders.forEach((h, i) => {
            cleanRow[cleanHeaders[i]] = String(row[h] ?? "").trim();
          });
          return cleanRow;
        });
        resolve({
          headers: cleanHeaders,
          data: rows,
          fileName: file.name,
          rowCount: rows.length,
          encoding: "UTF-8",
          delimiter: undefined,
        });
      } catch {
        reject({ type: "format", message: "No se pudo leer el archivo XLSX." } as ParseError);
      }
    };
    reader.onerror = () => reject({ type: "format", message: "No se pudo leer el archivo." } as ParseError);
    reader.readAsArrayBuffer(file);
  });
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
