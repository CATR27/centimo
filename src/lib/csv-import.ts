import { toMinor } from "./money";
import type { Category, Transaction, TxType } from "./types";

const DELIMS = [";", ",", "\t", "|"] as const;

/** Lee un CSV (comillas, saltos de línea dentro de comillas y separador autodetectado). */
export function parseCsv(input: string): { rows: string[][]; delimiter: string } {
  const text = input.replace(/^﻿/, "");
  const firstLine = (text.split(/\r?\n/).find((l) => l.trim()) ?? "");
  let best = ",", bestCount = -1;
  for (const d of DELIMS) {
    let count = 0, q = false;
    for (const ch of firstLine) { if (ch === '"') q = !q; else if (!q && ch === d) count++; }
    if (count > bestCount) { best = d; bestCount = count; }
  }

  const rows: string[][] = [];
  let row: string[] = [], cell = "", q = false;
  const push = () => { row.push(cell.trim()); cell = ""; };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === best) push();
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      push();
      if (row.some((c) => c !== "")) rows.push(row);
      row = [];
    } else cell += ch;
  }
  push();
  if (row.some((c) => c !== "")) rows.push(row);
  return { rows, delimiter: best };
}

export interface ColumnMap { date: number; amount: number; note: number; type: number; category: number; debit: number; credit: number }

const fold = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
const find = (h: string[], re: RegExp) => h.findIndex((x) => re.test(fold(x)));

/** Adivina qué columna es cada campo a partir de los encabezados. */
export function guessColumns(header: string[]): ColumnMap {
  const debit = find(header, /(debito|cargo|retiro|egreso|debit|withdraw)/);
  const credit = find(header, /(credito|abono|deposito|credit|deposit)/);
  return {
    date: find(header, /(fecha|date|^dia$|^day$)/),
    amount: find(header, /^(monto|importe|valor|amount|cantidad|total)/),
    note: find(header, /(descripcion|concepto|detalle|nota|description|memo|referencia|payee|comercio|beneficiario)/),
    type: find(header, /^(tipo|type)/),
    category: find(header, /(categoria|category)/),
    debit, credit,
  };
}

/** "1.234,56", "1,234.56", "$ 45.500", "(300)", "-12,5" → número (unidades mayores). */
export function parseAmount(raw: string): number | null {
  let s = raw.trim();
  if (!s) return null;
  const neg = /^\(.*\)$/.test(s) || /-/.test(s) || /\bDB\b/i.test(s);
  s = s.replace(/[^\d.,]/g, "");
  if (!/\d/.test(s)) return null;
  const dots = (s.match(/\./g) ?? []).length, commas = (s.match(/,/g) ?? []).length;
  let dec = "";
  if (dots && commas) dec = s.lastIndexOf(".") > s.lastIndexOf(",") ? "." : ",";
  else if (commas) {
    const after = s.length - s.lastIndexOf(",") - 1;
    dec = commas === 1 && (after <= 2 || s.indexOf(",") > 3) ? "," : "";
  } else if (dots) {
    const after = s.length - s.lastIndexOf(".") - 1;
    dec = dots === 1 && (after <= 2 || s.indexOf(".") > 3) ? "." : "";
  }
  const norm = dec ? s.replace(dec === "." ? /,/g : /\./g, "").replace(dec, ".") : s.replace(/[.,]/g, "");
  const n = Number(norm);
  if (!Number.isFinite(n)) return null;
  if (neg && n > 0) return -n;
  return n;
}

/** Fechas ISO, dd/mm/aaaa o mm/dd/aaaa → YYYY-MM-DD. */
export function parseDate(raw: string, dayFirst: boolean): string | null {
  const s = raw.trim();
  let y: number, m: number, d: number;
  let r = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (r) { y = +r[1]; m = +r[2]; d = +r[3]; }
  else {
    r = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
    if (!r) return null;
    const a = +r[1], b = +r[2];
    y = +r[3] < 100 ? 2000 + +r[3] : +r[3];
    if (a > 12) { d = a; m = b; } else if (b > 12) { d = b; m = a; } else if (dayFirst) { d = a; m = b; } else { d = b; m = a; }
  }
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** true = día primero; se deduce del primer valor ambiguo imposible (p. ej. 25/03). */
export function detectDayFirst(values: string[]): boolean {
  for (const v of values) {
    const r = v.trim().match(/^(\d{1,2})[-/.](\d{1,2})[-/.]\d{2,4}/);
    if (!r) continue;
    if (+r[1] > 12) return true;
    if (+r[2] > 12) return false;
  }
  return true;
}

export interface ImportOptions {
  dayFirst: boolean;
  invertSign: boolean;
  currency: string;
  categories: Category[];
}
export interface ImportItem { line: number; date: string; amount: number; type: TxType; note: string; categoryId: string | null }
export interface ImportError { line: number; reason: string }

const EXPENSE_RE = /(gasto|egreso|retiro|debit|expense|cargo|salida|compra)/;
const INCOME_RE = /(ingreso|abono|deposito|credit|income|entrada|nomina)/;

/** Convierte las filas (sin encabezado) en movimientos usando el mapeo de columnas. */
export function buildItems(rows: string[][], map: ColumnMap, opt: ImportOptions, firstLine = 2): { items: ImportItem[]; errors: ImportError[] } {
  const items: ImportItem[] = [], errors: ImportError[] = [];
  rows.forEach((row, i) => {
    const line = i + firstLine;
    const get = (c: number) => (c >= 0 ? row[c] ?? "" : "");
    const date = parseDate(get(map.date), opt.dayFirst);
    if (!date) { errors.push({ line, reason: "Fecha no válida" }); return; }

    let value: number | null = null;
    let type: TxType | null = null;
    if (map.debit >= 0 || map.credit >= 0) {
      const d = parseAmount(get(map.debit)), c = parseAmount(get(map.credit));
      if (d && Math.abs(d) > 0) { value = Math.abs(d); type = "expense"; }
      else if (c && Math.abs(c) > 0) { value = Math.abs(c); type = "income"; }
    } else {
      const a = parseAmount(get(map.amount));
      if (a !== null && a !== 0) {
        value = Math.abs(a);
        type = (a < 0) !== opt.invertSign ? "expense" : "income";
      }
    }
    if (value === null || type === null) { errors.push({ line, reason: "Monto no válido" }); return; }

    const tv = fold(get(map.type));
    if (tv) { if (EXPENSE_RE.test(tv)) type = "expense"; else if (INCOME_RE.test(tv)) type = "income"; }

    const catName = fold(get(map.category));
    const cat = catName ? opt.categories.find((c) => fold(c.name) === catName && c.kind === type) : undefined;
    items.push({ line, date, amount: toMinor(value, opt.currency), type, note: get(map.note).slice(0, 80), categoryId: cat?.id ?? null });
  });
  return { items, errors };
}

/** Clave para detectar movimientos ya existentes y no duplicarlos. */
export const dupKey = (t: Pick<Transaction, "date" | "amount" | "type" | "note">) =>
  `${t.date}|${t.amount}|${t.type}|${fold(t.note)}`;
