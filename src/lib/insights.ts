import { getDate, getDaysInMonth, subMonths } from "date-fns";
import { byCategory, delta, totals, upcoming } from "./analytics";
import { addDaysISO, periodRanges, toISO, today, type Range } from "./dates";
import type { Category, Transaction } from "./types";

export type InsightTone = "good" | "warn" | "info";
export type InsightIcon = "trend" | "flame" | "zap" | "piggy" | "calendar";
export interface Insight { id: string; tone: InsightTone; icon: InsightIcon; title: string; body: string }

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const pct = (n: number) => `${Math.abs(n).toFixed(0)}%`;
const ORDER: Record<InsightTone, number> = { warn: 0, good: 1, info: 2 };

/** Hallazgos automáticos sobre el mes en curso. `fmt` formatea montos en la moneda del usuario. */
export function buildInsights(
  txs: Transaction[], cats: Category[], fmt: (minor: number) => string, now = new Date(),
): Insight[] {
  const out: Insight[] = [];
  const paidExp = txs.filter((t) => t.status === "paid" && t.type === "expense" && !t.transferId);
  const month = periodRanges("MES", now).current;
  const prevMonth = periodRanges("MES", subMonths(now, 1)).current;
  const dayOfMonth = getDate(now);
  const daysInMonth = getDaysInMonth(now);
  const cur = totals(txs, month);

  // 1) Proyección de cierre de mes
  if (dayOfMonth >= 3 && cur.expense > 0) {
    const projected = Math.round((cur.expense / dayOfMonth) * daysInMonth);
    const prev = totals(txs, prevMonth).expense;
    const change = prev > 0 ? delta(projected, prev) : null;
    out.push({
      id: "projection", icon: "trend",
      tone: change === null ? "info" : change > 10 ? "warn" : change < -10 ? "good" : "info",
      title: "Proyección del mes",
      body: `A este ritmo cerrarás en ${fmt(projected)}${change === null ? "." : ` (${change >= 0 ? "▲" : "▼"} ${pct(change)} vs ${fmt(prev)} el mes pasado).`}`,
    });
  }

  // 2) Categoría que más sube (mismo tramo del mes anterior)
  const sameSpan: Range = {
    from: prevMonth.from,
    to: toISO(new Date(Number(prevMonth.from.slice(0, 4)), Number(prevMonth.from.slice(5, 7)) - 1, Math.min(dayOfMonth, getDaysInMonth(subMonths(now, 1))))),
  };
  const nowCats = byCategory(txs, cats, { from: month.from, to: today() });
  const prevCats = byCategory(txs, cats, sameSpan);
  const risers = nowCats
    .map((s) => ({ s, p: prevCats.find((x) => x.id === s.id)?.value ?? 0 }))
    .filter((x) => x.p > 0 && x.s.value > x.p)
    .map((x) => ({ ...x, change: ((x.s.value - x.p) / x.p) * 100 }))
    .filter((x) => x.change >= 30)
    .sort((a, b) => (b.s.value - b.p) - (a.s.value - a.p));
  if (risers[0]) {
    const r = risers[0];
    out.push({ id: "riser", icon: "flame", tone: "warn", title: `${r.s.name} sube ${pct(r.change)}`, body: `Llevas ${fmt(r.s.value)} este mes frente a ${fmt(r.p)} en el mismo tramo del mes pasado.` });
  }

  // 3) Gasto inusual en los últimos 14 días (> 2× la mediana de su categoría)
  const since = addDaysISO(today(), -14);
  let unusual: { t: Transaction; ratio: number; name: string } | null = null;
  for (const t of paidExp) {
    if (t.date < since || !t.categoryId) continue;
    const hist = paidExp.filter((x) => x.categoryId === t.categoryId && x.id !== t.id && x.date < t.date).map((x) => x.amount);
    if (hist.length < 5) continue;
    const med = median(hist);
    const ratio = med > 0 ? t.amount / med : 0;
    if (ratio >= 2 && (!unusual || ratio > unusual.ratio)) {
      unusual = { t, ratio, name: cats.find((c) => c.id === t.categoryId)?.name ?? "su categoría" };
    }
  }
  if (unusual) {
    out.push({ id: "unusual", icon: "zap", tone: "warn", title: "Gasto inusual", body: `${unusual.t.note || "Un gasto"} por ${fmt(unusual.t.amount)}: ${unusual.ratio.toFixed(1)}× lo habitual en ${unusual.name}.` });
  }

  // 4) Racha sin gastar
  const spentDays = new Set(paidExp.map((t) => t.date));
  let streak = 0;
  for (let i = 0; i < 60; i++) { if (spentDays.has(addDaysISO(today(), -i))) break; streak++; }
  if (streak >= 2) out.push({ id: "streak", icon: "flame", tone: "good", title: `${streak} días sin gastar`, body: "Buena racha: sigue así para mejorar tu ahorro del mes." });

  // 5) Ahorro del mes
  if (cur.income > 0) {
    const rate = (cur.net / cur.income) * 100;
    if (rate >= 20) out.push({ id: "saving", icon: "piggy", tone: "good", title: `Ahorras ${pct(rate)}`, body: `Este mes has guardado ${fmt(cur.net)} de ${fmt(cur.income)} que ingresaron.` });
    else if (rate < 0) out.push({ id: "deficit", icon: "piggy", tone: "warn", title: "Gastas más de lo que ingresas", body: `Déficit del mes: ${fmt(-cur.net)}. Revisa las categorías más altas.` });
  }

  // 6) Pagos próximos (7 días)
  const limit = addDaysISO(today(), 7);
  const soon = upcoming(txs).filter((t) => t.type === "expense" && t.date <= limit);
  if (soon.length) {
    out.push({ id: "upcoming", icon: "calendar", tone: "info", title: "Pagos esta semana", body: `${soon.length} ${soon.length === 1 ? "pago" : "pagos"} por ${fmt(soon.reduce((a, t) => a + t.amount, 0))} en los próximos 7 días.` });
  }

  return out.sort((a, b) => ORDER[a.tone] - ORDER[b.tone]);
}
