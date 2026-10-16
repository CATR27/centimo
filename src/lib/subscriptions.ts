import { addDays, differenceInCalendarDays } from "date-fns";
import { parse, toISO } from "./dates";
import type { Recurrence, Transaction } from "./types";

export interface Subscription {
  key: string;
  name: string;
  categoryId: string | null;
  /** importe típico por cobro (unidades menores) */
  amount: number;
  period: Exclude<Recurrence, null>;
  monthlyCost: number;
  yearlyCost: number;
  /** próximo cobro YYYY-MM-DD */
  next: string | null;
  /** id del movimiento programado (permite "marcar pagado") */
  plannedId: string | null;
  lastPaid: string | null;
  count: number;
}

const PERIOD_DAYS: Record<Exclude<Recurrence, null>, number> = { weekly: 7, monthly: 30, yearly: 365 };
const MONTHLY_FACTOR: Record<Exclude<Recurrence, null>, number> = { weekly: 52 / 12, monthly: 1, yearly: 1 / 12 };

const norm = (t: Transaction) => (t.note || "").trim().toLowerCase();
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** Periodo detectado por los días entre pagos; exige que ≥75% de los intervalos sean regulares. */
function periodFromGaps(dates: string[]): Exclude<Recurrence, null> | null {
  const gaps = dates.slice(1).map((d, i) => differenceInCalendarDays(parse(d), parse(dates[i])));
  if (gaps.length < 2) return null;
  const g = median(gaps);
  const period: Exclude<Recurrence, null> | null = g >= 6 && g <= 8 ? "weekly" : g >= 25 && g <= 35 ? "monthly" : g >= 350 && g <= 380 ? "yearly" : null;
  if (!period) return null;
  const tol = period === "weekly" ? 1 : period === "monthly" ? 4 : 15;
  const regular = gaps.filter((x) => Math.abs(x - g) <= tol).length;
  return regular / gaps.length >= 0.75 ? period : null;
}

/**
 * Detecta pagos recurrentes: los programados con repetición, y los pagados ≥3 veces
 * con importe parecido (±10%) a intervalos regulares.
 */
export function detectSubscriptions(txs: Transaction[]): Subscription[] {
  const groups = new Map<string, Transaction[]>();
  for (const t of txs) {
    if (t.type !== "expense" || t.transferId) continue;
    const name = norm(t);
    if (!name) continue;
    const key = `${name}|${t.categoryId ?? ""}`;
    groups.set(key, [...(groups.get(key) ?? []), t]);
  }

  const out: Subscription[] = [];
  for (const [key, list] of groups) {
    const paid = list.filter((t) => t.status === "paid").sort((a, b) => a.date.localeCompare(b.date));
    const planned = list.filter((t) => t.status === "planned").sort((a, b) => a.date.localeCompare(b.date));
    const plannedRec = planned.find((t) => t.recurrence);

    let period: Exclude<Recurrence, null> | null = plannedRec?.recurrence ?? null;
    let amount = plannedRec?.amount ?? 0;
    if (!period) {
      if (paid.length < 3) continue;
      const med = median(paid.map((t) => t.amount));
      const similar = paid.filter((t) => Math.abs(t.amount - med) <= med * 0.1);
      if (similar.length < 3) continue;
      period = periodFromGaps(similar.map((t) => t.date));
      if (!period) continue;
      amount = Math.round(med);
    }

    const last = paid[paid.length - 1] ?? null;
    const next = plannedRec?.date ?? planned[0]?.date ?? (last ? toISO(addDays(parse(last.date), PERIOD_DAYS[period])) : null);
    const sample = plannedRec ?? last ?? list[0];
    const monthlyCost = Math.round(amount * MONTHLY_FACTOR[period]);
    out.push({
      key, name: sample.note.trim(), categoryId: sample.categoryId, amount, period,
      monthlyCost, yearlyCost: monthlyCost * 12, next,
      plannedId: plannedRec?.id ?? planned[0]?.id ?? null,
      lastPaid: last?.date ?? null, count: paid.length,
    });
  }
  return out.sort((a, b) => b.monthlyCost - a.monthlyCost);
}

export const PERIOD_LABEL: Record<Exclude<Recurrence, null>, string> = { weekly: "Semanal", monthly: "Mensual", yearly: "Anual" };
