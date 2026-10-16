import { budgetStatus, totals } from "./analytics";
import { periodRanges, type Range } from "./dates";
import type { Category, Snapshot, Transaction } from "./types";

export interface BudgetAlert {
  id: string;
  kind: "category" | "global";
  name: string;
  color: string;
  spent: number;
  budget: number;
  ratio: number;
  level: "warn" | "over";
}

export const WARN_AT = 0.8;

const levelOf = (ratio: number): "warn" | "over" | null => (ratio >= 1 ? "over" : ratio >= WARN_AT ? "warn" : null);

/** Alertas del mes: categorías con presupuesto y presupuesto global, de mayor a menor uso. */
export function budgetAlerts(
  txs: Transaction[], cats: Category[], monthlyBudget: number | null, month: Range = periodRanges("MES").current,
): BudgetAlert[] {
  const out: BudgetAlert[] = [];
  for (const b of budgetStatus(txs, cats, month)) {
    const level = levelOf(b.ratio);
    if (level) out.push({ id: `c:${b.category.id}`, kind: "category", name: b.category.name, color: b.category.color, spent: b.spent, budget: b.budget, ratio: b.ratio, level });
  }
  if (monthlyBudget && monthlyBudget > 0) {
    const spent = totals(txs, month).expense;
    const ratio = spent / monthlyBudget;
    const level = levelOf(ratio);
    if (level) out.push({ id: "global", kind: "global", name: "Presupuesto del mes", color: "var(--accent)", spent, budget: monthlyBudget, ratio, level });
  }
  return out.sort((a, b) => b.ratio - a.ratio);
}

/** Alertas que aparecen (o suben de nivel) al pasar de `before` a `afterTxs`. */
export function newlyCrossed(before: Snapshot, afterTxs: Transaction[]): BudgetAlert[] {
  const prev = new Map(budgetAlerts(before.transactions, before.categories, before.settings.monthlyBudget).map((a) => [a.id, a.level]));
  return budgetAlerts(afterTxs, before.categories, before.settings.monthlyBudget)
    .filter((a) => prev.get(a.id) !== a.level);
}
