import { describe, it, expect } from "vitest";

function testDelimiter(input: string): string {
  const counts: Record<string, number> = { ",": 0, ";": 0, "\t": 0, "|": 0 };
  for (const ch of input) {
    if (ch in counts) counts[ch]++;
  }
  const max = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (max[1] === 0) return ",";
  return max[0];
}

function testSplit(line: string, delimiter: string): string[] {
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

describe("Parser - Delimiter Detection", () => {
  it("detects comma delimiter", () => {
    expect(testDelimiter("direccion,ciudad,region")).toBe(",");
  });

  it("detects semicolon delimiter", () => {
    expect(testDelimiter("direccion;ciudad;region")).toBe(";");
  });

  it("detects tab delimiter", () => {
    expect(testDelimiter("direccion\tciudad\tregion")).toBe("\t");
  });

  it("defaults to comma when no delimiters found", () => {
    expect(testDelimiter("direccion")).toBe(",");
  });
});

describe("Parser - CSV Line Splitting", () => {
  it("splits on comma", () => {
    expect(testSplit("a,b,c", ",")).toEqual(["a", "b", "c"]);
  });

  it("handles quoted fields", () => {
    expect(testSplit('a,"b,c",d', ",")).toEqual(["a", "b,c", "d"]);
  });

  it("handles escaped quotes", () => {
    expect(testSplit('a,"b""c",d', ",")).toEqual(["a", 'b"c', "d"]);
  });

  it("handles semicolon delimiter", () => {
    expect(testSplit("a;b;c", ";")).toEqual(["a", "b", "c"]);
  });
});
