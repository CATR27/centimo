"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Avatar } from "@/components/avatar";
import { DotBar } from "@/components/design";
import { Card } from "@/components/ui/card";
import { budgetAlerts } from "@/lib/budget";
import { buildInsights, type Insight } from "@/lib/insights";
import { PERIOD_LABEL, detectSubscriptions } from "@/lib/subscriptions";
import { relativeDay } from "@/lib/dates";
import { formatCompact, formatMoney } from "@/lib/money";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const MARK = { good: "▲", warn: "!", info: "$" } as const;
const MARK_STYLE = { good: "bg-lime text-lime-ink", warn: "bg-[#ff7a9c] text-[#0a0d0c]", info: "bg-dk-3 text-white" } as const;

export function useInsights() {
  const { transactions, categories, settings } = useStore();
  return useMemo(
    () => buildInsights(transactions, categories, (n) => formatCompact(n, settings.currency)),
    [transactions, categories, settings.currency],
  );
}

export function InsightList({ insights, limit = 4 }: { insights: Insight[]; limit?: number }) {
  if (insights.length === 0) return <p className="py-3 text-sm text-dk-muted">Aún no hay suficientes datos para generar hallazgos.</p>;
  return (
    <ul className="space-y-3.5">
      {insights.slice(0, limit).map((i) => (
        <li key={i.id} className="flex items-start gap-3">
          <span className={cn("grid size-[38px] shrink-0 place-items-center rounded-full text-[13px] font-bold", MARK_STYLE[i.tone])}>{MARK[i.tone]}</span>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold leading-tight">{i.title}</p>
            <p className="mt-0.5 text-[13px] leading-snug text-dk-muted">{i.body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function InsightsCard({ limit = 4, className }: { limit?: number; className?: string }) {
  const insights = useInsights();
  return (
    <div className={cn("card-dark rounded-[28px] p-[18px]", className)}>
      <h2 className="mb-3.5 text-[17px] font-semibold">Hallazgos</h2>
      <InsightList insights={insights} limit={limit} />
    </div>
  );
}

export function useAlerts() {
  const { transactions, categories, settings } = useStore();
  return useMemo(
    () => budgetAlerts(transactions, categories, settings.monthlyBudget),
    [transactions, categories, settings.monthlyBudget],
  );
}

export function BudgetAlertsCard({ className }: { className?: string }) {
  const alerts = useAlerts();
  const { settings } = useStore();
  const cur = settings.currency;
  const over = alerts.filter((a) => a.level === "over").length;
  return (
    <Card className={cn("flex flex-col gap-3.5 p-[18px]", className)}>
      <div className="grid grid-cols-[minmax(0,1fr)_96px] items-center gap-3">
        <span className="flex flex-col">
          <span className="text-[17px] font-semibold">Presupuestos</span>
          <span className="text-[13px] text-muted">{alerts.length === 0 ? "Todo dentro de presupuesto" : `${over} excedido${over === 1 ? "" : "s"} · ${alerts.length - over} en rango`}</span>
          <Link href="/categorias" className="mt-1 text-sm font-semibold">Editar ›</Link>
        </span>
        <Avatar n={10} className="size-24" />
      </div>
      {alerts.slice(0, 4).map((a) => (
        <div key={a.id} className="flex flex-col gap-1.5">
          <span className="flex justify-between text-sm">
            <span className="font-semibold">{a.name}</span>
            <span className={cn("num font-semibold", a.level === "over" ? "text-neg" : "text-amber")}>{Math.round(a.ratio * 100)}% · {formatMoney(a.spent, cur)}</span>
          </span>
          <DotBar on={Math.min(12, Math.round(a.ratio * 12))} total={12} color={a.level === "over" ? "var(--neg)" : "var(--text)"} track="var(--border)" className="bg-surface-2" />
        </div>
      ))}
    </Card>
  );
}

export function SubscriptionsCard({ className }: { className?: string }) {
  const { transactions, settings } = useStore();
  const cur = settings.currency;
  const subs = useMemo(() => detectSubscriptions(transactions), [transactions]);
  const monthly = subs.reduce((a, s) => a + s.monthlyCost, 0);
  return (
    <Card className={cn("p-[18px]", className)}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[17px] font-semibold">Suscripciones</h2>
        <Link href="/suscripciones" className="text-sm font-semibold text-ink/60">Ver ›</Link>
      </div>
      {subs.length === 0 ? <p className="text-sm text-muted">Aún no detectamos pagos recurrentes.</p> : (
        <>
          <p className="num text-2xl font-semibold">{formatMoney(monthly, settings.currency)}<span className="ml-1.5 text-xs font-medium text-muted">/ mes</span></p>
          <ul className="mt-3 space-y-2.5">
            {subs.slice(0, 4).map((s) => (
              <li key={s.key} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-semibold first-letter:uppercase">{s.name}</span>
                  <span className="block text-xs text-muted">{PERIOD_LABEL[s.period]}{s.next ? ` · ${relativeDay(s.next)}` : ""}</span>
                </span>
                <span className="num shrink-0 font-semibold">{formatCompact(s.monthlyCost, cur)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
