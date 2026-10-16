import { addDaysISO, inRange, parse, type Range } from "./dates";
import { eachDayOfInterval, eachMonthOfInterval, format } from "date-fns";
import { es } from "date-fns/locale";
import type { Category, Transaction } from "./types";

/** Pagado y que no sea una transferencia entre cuentas (no es ingreso ni gasto real). */
const paid = (t: Transaction) => t.status === "paid" && !t.transferId;

export function totals(txs: Transaction[], r: Range) {
  let income = 0, expense = 0;
  for (const t of txs) {
    if (!paid(t) || !inRange(t.date, r)) continue;
    if (t.type === "income") income += t.amount; else expense += t.amount;
  }
  return { income, expense, net: income - expense };
}

/** Variación porcentual; null si no hay base de comparación. */
export const delta = (cur: number, prev: number) => (prev === 0 ? null : ((cur - prev) / prev) * 100);

export interface SeriesPoint { label: string; date: string; expense: number; income: number; cumulative: number }

/** Serie diaria (o mensual para rangos > 92 días) de gasto/ingreso con acumulado. */
export function series(txs: Transaction[], r: Range): SeriesPoint[] {
  const start = parse(r.from);
  const end = parse(r.to);
  const days = eachDayOfInterval({ start, end });
  const monthly = days.length > 92;
  const buckets = new Map<string, SeriesPoint>();
  const keyOf = (d: Date) => format(d, monthly ? "yyyy-MM" : "yyyy-MM-dd");
  const labelOf = (d: Date) => format(d, monthly ? "MMM" : days.length <= 8 ? "EEE" : "d MMM", { locale: es });

  for (const d of monthly ? eachMonthOfInterval({ start, end }) : days) {
    buckets.set(keyOf(d), { label: labelOf(d), date: format(d, "yyyy-MM-dd"), expense: 0, income: 0, cumulative: 0 });
  }
  for (const t of txs) {
    if (!paid(t) || !inRange(t.date, r)) continue;
    const b = buckets.get(keyOf(parse(t.date)));
    if (!b) continue;
    if (t.type === "income") b.income += t.amount; else b.expense += t.amount;
  }
  let acc = 0;
  return [...buckets.values()].map((b) => ({ ...b, cumulative: (acc += b.expense) }));
}

export interface CategorySlice {
  category: Category | null; id: string; name: string; color: string; value: number; pct: number; count: number;
}

export function byCategory(txs: Transaction[], cats: Category[], r: Range, type: "expense" | "income" = "expense"): CategorySlice[] {
  const map = new Map<string, CategorySlice>();
  let total = 0;
  for (const t of txs) {
    if (!paid(t) || t.type !== type || !inRange(t.date, r)) continue;
    const key = t.categoryId ?? "none";
    const cat = cats.find((c) => c.id === t.categoryId) ?? null;
    const s = map.get(key) ?? { category: cat, id: key, name: cat?.name ?? "Sin categoría", color: cat?.color ?? "#7b8798", value: 0, pct: 0, count: 0 };
    s.value += t.amount; s.count++; total += t.amount;
    map.set(key, s);
  }
  return [...map.values()].sort((a, b) => b.value - a.value).map((s) => ({ ...s, pct: total ? (s.value / total) * 100 : 0 }));
}

/** Gasto del mes en curso por categoría vs presupuesto. */
export function budgetStatus(txs: Transaction[], cats: Category[], month: Range) {
  return cats
    .filter((c) => c.kind === "expense" && c.monthlyBudget)
    .map((c) => {
      const spent = txs.filter((t) => paid(t) && t.type === "expense" && t.categoryId === c.id && inRange(t.date, month))
        .reduce((a, t) => a + t.amount, 0);
      return { category: c, spent, budget: c.monthlyBudget as number, ratio: spent / (c.monthlyBudget as number) };
    })
    .sort((a, b) => b.ratio - a.ratio);
}

export const upcoming = (txs: Transaction[], withinDays = 365) => {
  const limit = addDaysISO(new Date().toISOString().slice(0, 10), withinDays);
  return txs.filter((t) => t.status === "planned" && t.date <= limit).sort((a, b) => a.date.localeCompare(b.date));
};

/** Día de la semana (0=lun) con mayor gasto y promedio diario. */
export function weekdayPattern(txs: Transaction[], r: Range) {
  const sums = Array(7).fill(0) as number[];
  const counts = Array(7).fill(0) as number[];
  for (const d of eachDayOfInterval({ start: parse(r.from), end: parse(r.to) })) counts[(d.getDay() + 6) % 7]++;
  for (const t of txs) {
    if (!paid(t) || t.type !== "expense" || !inRange(t.date, r)) continue;
    sums[(parse(t.date).getDay() + 6) % 7] += t.amount;
  }
  return ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((label, i) => ({
    label, total: sums[i], avg: counts[i] ? sums[i] / counts[i] : 0,
  }));
}
