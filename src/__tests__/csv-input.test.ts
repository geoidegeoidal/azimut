import { expect, it } from "vitest";
import { parseCSVBuffer, parseXLSXBuffer } from "@/engine/parser";
import * as XLSX from "xlsx";

it("preserves UTF-8 Chilean accents and quoted multiline addresses", () => {
  const input = 'Dirección;Comuna\n"José Miguel de la Barra 650\npiso 1";Santiago\nMaipú 2359;Concepción';
  const result = parseCSVBuffer(new TextEncoder().encode(input).buffer, "ejemplo.csv");
  expect(result.encoding).toBe("UTF-8");
  expect(result.rowCount).toBe(2);
  expect(result.data[0]["dirección"]).toContain("José Miguel");
  expect(result.data[1].comuna).toBe("Concepción");
});

it("decodes Windows-1252 without corrupting Ñ or accented names", () => {
  const bytes = Uint8Array.from([100,105,114,101,99,99,105,243,110,10,77,97,105,112,250,32,50,51,53,57]);
  expect(parseCSVBuffer(bytes.buffer, "latin.csv").data[0]["dirección"]).toBe("Maipú 2359");
});

it("rejects duplicate columns instead of silently overwriting the address", () => {
  expect(() => parseCSVBuffer(new TextEncoder().encode("calle,calle\nMaipú,2359").buffer, "duplicado.csv")).toThrow();
});

it("rejects CSV rows with extra fields instead of dropping locality", () => {
  expect(() => parseCSVBuffer(new TextEncoder().encode("direccion,comuna\nMatucana,501,Santiago").buffer, "mal-separado.csv")).toThrow();
});

it("rejects XLSX columns that collide after trimming or case folding", async () => {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["Dirección", " dirección ", "Comuna"], ["Matucana", "501", "Santiago"]]), "Direcciones");
  await expect(parseXLSXBuffer(XLSX.write(workbook, { type: "array", bookType: "xlsx" }), "duplicado.xlsx")).rejects.toMatchObject({ type: "structure" });
});

it("preserves displayed XLSX numbering and accent spelling", async () => {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([["Dirección", "Número", "Comuna"], ["Fernando Márquez de la Plata", 192, "Providencia"]]);
  sheet.B2.z = "0000";
  XLSX.utils.book_append_sheet(workbook, sheet, "Direcciones");
  const parsed = await parseXLSXBuffer(XLSX.write(workbook, { type: "array", bookType: "xlsx" }), "direcciones.xlsx");
  expect(parsed.data[0]).toEqual({ "dirección": "Fernando Márquez de la Plata", "número": "0192", comuna: "Providencia" });
});
