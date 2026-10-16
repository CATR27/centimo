"use client";

import { AlertTriangle, CalendarClock, CheckCircle2, Flame, PiggyBank, TrendingUp, Zap } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { BudgetBar } from "@/components/charts/charts";
import { Card, SectionTitle } from "@/components/ui/card";
import { budgetAlerts } from "@/lib/budget";
import { buildInsights, type Insight, type InsightIcon } from "@/lib/insights";
import { PERIOD_LABEL, detectSubscriptions } from "@/lib/subscriptions";
import { relativeDay } from "@/lib/dates";
import { formatCompact, formatMoney } from "@/lib/money";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const ICONS: Record<InsightIcon, typeof Zap> = { trend: TrendingUp, flame: Flame, zap: Zap, piggy: PiggyBank, calendar: CalendarClock };
const TONE = {
  good: "bg-pos/15 text-pos",
  warn: "bg-neg/12 text-neg",
  info: "bg-surface-2 text-ink",
} as const;

export function useInsights() {
  const { transactions, categories, settings } = useStore();
  return useMemo(
    () => buildInsights(transactions, categories, (n) => formatCompact(n, settings.currency)),
    [transactions, categories, settings.currency],
  );
}

export function InsightList({ insights, limit = 4 }: { insights: Insight[]; limit?: number }) {
  if (insights.length === 0) return <p className="py-3 text-sm text-muted">Aún no hay suficientes datos para generar hallazgos.</p>;
  return (
    <ul className="space-y-3">
      {insights.slice(0, limit).map((i) => {
        const Icon = ICONS[i.icon];
        return (
          <li key={i.id} className="flex items-start gap-3">
            <span className={cn("grid size-10 shrink-0 place-items-center rounded-full", TONE[i.tone])}><Icon className="size-[18px]" /></span>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight">{i.title}</p>
              <p className="mt-0.5 text-[13px] leading-snug text-muted">{i.body}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function InsightsCard({ limit = 4, className }: { limit?: number; className?: string }) {
  const insights = useInsights();
  return (
    <Card className={cn("rounded-[36px]", className)}>
      <SectionTitle>Hallazgos</SectionTitle>
      <InsightList insights={insights} limit={limit} />
    </Card>
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
  return (
    <Card className={cn("rounded-[36px]", className)}>
      <SectionTitle action={<Link href="/categorias" className="text-sm font-semibold text-ink/70">Editar →</Link>}>Presupuestos</SectionTitle>
      {alerts.length === 0 ? (
        <div className="flex items-center gap-3 text-sm">
          <span className="grid size-10 place-items-center rounded-full bg-pos/15 text-pos"><CheckCircle2 className="size-5" /></span>
          <p className="text-muted">Todo dentro de presupuesto este mes.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {alerts.slice(0, 4).map((a) => (
            <li key={a.id}>
              <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                <span className="flex min-w-0 items-center gap-2 font-medium">
                  <AlertTriangle className={cn("size-4 shrink-0", a.level === "over" ? "text-neg" : "text-amber")} />
                  <span className="truncate">{a.name}</span>
                </span>
                <span className={cn("num shrink-0 text-xs", a.level === "over" ? "font-semibold text-neg" : "text-muted")}>
                  {Math.round(a.ratio * 100)}% · {formatMoney(a.spent, cur)}
                </span>
              </div>
              <BudgetBar ratio={a.ratio} color={a.color} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function SubscriptionsCard({ className }: { className?: string }) {
  const { transactions, settings } = useStore();
  const cur = settings.currency;
  const subs = useMemo(() => detectSubscriptions(transactions), [transactions]);
  const monthly = subs.reduce((a, s) => a + s.monthlyCost, 0);
  return (
    <Card className={cn("rounded-[36px]", className)}>
      <SectionTitle action={<Link href="/suscripciones" className="text-sm font-semibold text-ink/70">Ver →</Link>}>Suscripciones</SectionTitle>
      {subs.length === 0 ? <p className="text-sm text-muted">Aún no detectamos pagos recurrentes.</p> : (
        <>
          <p className="num text-2xl font-semibold">{formatMoney(monthly, settings.currency)}<span className="ml-1.5 text-xs font-medium text-muted">/ mes</span></p>
          <ul className="mt-3 space-y-2.5">
            {subs.slice(0, 4).map((s) => (
              <li key={s.key} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-medium first-letter:uppercase">{s.name}</span>
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
