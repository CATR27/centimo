"use client";

import { ArrowDownLeft, ArrowUpRight, Minus, Plus, Scale } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BudgetBar, CategoryDonut, SpendArea } from "@/components/charts/charts";
import { CategoryIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { PeriodChips } from "@/components/period-chips";
import { HScroll } from "@/components/ui/hscroll";
import { useQuickAdd } from "@/components/transactions/quick-add";
import { TxRow } from "@/components/transactions/tx-row";
import { Card, SectionTitle } from "@/components/ui/card";
import { Delta, EmptyState, Skeleton } from "@/components/ui/misc";
import { budgetStatus, byCategory, delta, series, totals, upcoming } from "@/lib/analytics";
import { addDaysISO, periodRanges, today, type Period } from "@/lib/dates";
import { formatCompact, formatMoney } from "@/lib/money";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { ready, transactions, categories, settings, markPaid } = useStore();
  const open = useQuickAdd();
  const [period, setPeriod] = useState<Period>("30D");
  const cur = settings.currency;

  const d = useMemo(() => {
    const { current, previous, days } = periodRanges(period);
    const now = totals(transactions, current);
    const before = totals(transactions, previous);
    const month = periodRanges("MES").current;
    return {
      now, before, days,
      spark: series(transactions, current),
      slices: byCategory(transactions, categories, current),
      budgets: budgetStatus(transactions, categories, month).slice(0, 4),
      soon: upcoming(transactions, 7),
      recent: transactions.filter((t) => t.status === "paid").sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    };
  }, [transactions, categories, period]);

  if (!ready) return <DashSkeleton />;

  const elapsed = period === "MES" || period === "AÑO"
    ? Math.max(1, d.spark.filter((p) => p.date <= today()).length) : d.days;
  const dailyAvg = d.now.expense / elapsed;
  const greeting = settings.displayName ? `Hola, ${settings.displayName.split(" ")[0]}` : "Resumen";

  return (
    <div className="space-y-4">
      <PageHeader title={greeting} sub="Tu panel de gastos" />
      <HScroll className="-mx-4 px-4"><PeriodChips value={period} onChange={setPeriod} /></HScroll>

      {/* Acciones rápidas */}
      <div className="grid grid-cols-2 gap-2.5">
        <button onClick={() => open({ type: "expense" })}
          className="flex h-12 items-center justify-center gap-2 rounded-xl border border-neg/40 bg-neg/10 text-sm font-semibold text-neg active:scale-[0.98]">
          <Minus className="size-4" /> Gasto
        </button>
        <button onClick={() => open({ type: "income" })}
          className="flex h-12 items-center justify-center gap-2 rounded-xl border border-pos/40 bg-pos/10 text-sm font-semibold text-pos active:scale-[0.98]">
          <Plus className="size-4" /> Ingreso
        </button>
      </div>

      {/* Ticker principal */}
      <Card className="relative overflow-hidden">
        <div className="relative">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            <span className="pulse-dot size-1.5 rounded-full bg-neg" /> Gasto · {period}
          </div>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3">
            <span className="num text-[2.1rem] font-semibold leading-tight sm:text-4xl">{formatMoney(d.now.expense, cur)}</span>
            <Delta value={delta(d.now.expense, d.before.expense)} invert />
          </div>
          <p className="num text-xs text-muted">vs {formatMoney(d.before.expense, cur)} periodo anterior</p>
        </div>
        <div className="relative -mx-1 mt-3">
          <SpendArea data={d.spark} currency={cur} height={170} />
        </div>
      </Card>

      {/* Mini tickers */}
      <div className="grid grid-cols-3 gap-2.5">
        <Tile label="Ingresos" Icon={ArrowDownLeft} tone="pos" value={formatCompact(d.now.income, cur)} d={delta(d.now.income, d.before.income)} />
        <Tile label="Balance" Icon={Scale} tone={d.now.net >= 0 ? "pos" : "neg"} value={formatCompact(d.now.net, cur)} d={null} />
        <Tile label="Prom./día" Icon={ArrowUpRight} tone="cyan" value={formatCompact(dailyAvg, cur)} d={null} />
      </div>

      {/* Distribución */}
      <Card>
        <SectionTitle action={<Link href="/analisis" className="text-xs text-accent">Ver análisis</Link>}>Por categoría</SectionTitle>
        {d.slices.length === 0 ? <EmptyState title="Sin gastos en este periodo" hint="Registra uno con el botón +" /> : (
          <div className="flex flex-col items-center gap-5 sm:flex-row">
            <CategoryDonut data={d.slices} currency={cur} centerLabel="Total" centerValue={formatCompact(d.now.expense, cur)} />
            <ul className="w-full flex-1 space-y-2.5">
              {d.slices.slice(0, 5).map((s) => (
                <li key={s.id} className="flex items-center gap-3">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
                  <span className="min-w-0 flex-1 truncate text-sm">{s.name}</span>
                  <span className="num text-xs text-muted">{s.pct.toFixed(0)}%</span>
                  <span className="num w-24 text-right text-sm font-medium">{formatCompact(s.value, cur)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* Presupuestos */}
      {d.budgets.length > 0 && (
        <Card>
          <SectionTitle action={<Link href="/categorias" className="text-xs text-accent">Editar</Link>}>Presupuestos del mes</SectionTitle>
          <ul className="space-y-4">
            {d.budgets.map((b) => (
              <li key={b.category.id}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2" style={{ color: b.category.color }}>
                    <CategoryIcon name={b.category.icon} className="size-4" />
                    <span className="text-ink">{b.category.name}</span>
                  </span>
                  <span className={cn("num text-xs", b.ratio > 1 ? "text-neg" : "text-muted")}>
                    {formatCompact(b.spent, cur)} / {formatCompact(b.budget, cur)}
                  </span>
                </div>
                <BudgetBar ratio={b.ratio} color={b.category.color} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Próximos */}
      <Card>
        <SectionTitle action={<Link href="/proximos" className="text-xs text-accent">Todos</Link>}>Próximos 7 días</SectionTitle>
        {d.soon.length === 0 ? <p className="py-3 text-sm text-muted">Nada programado esta semana.</p> : (
          <div className="divide-y divide-line/60">
            {d.soon.map((t) => <TxRow key={t.id} tx={t} showDate onPay={() => markPaid(t.id)} />)}
          </div>
        )}
        <p className="num mt-2 text-right text-[11px] text-muted">
          Hasta {addDaysISO(today(), 7)} · {formatMoney(d.soon.reduce((a, t) => a + t.amount, 0), cur)}
        </p>
      </Card>

      {/* Recientes */}
      <Card>
        <SectionTitle action={<Link href="/transacciones" className="text-xs text-accent">Historial</Link>}>Recientes</SectionTitle>
        {d.recent.length === 0 ? <EmptyState title="Aún no hay movimientos" /> : (
          <div className="divide-y divide-line/60">{d.recent.map((t) => <TxRow key={t.id} tx={t} showDate />)}</div>
        )}
      </Card>
    </div>
  );
}

function Tile({ label, value, d, Icon, tone }: {
  label: string; value: string; d: number | null; Icon: typeof Scale; tone: "pos" | "neg" | "cyan";
}) {
  const color = { pos: "text-pos", neg: "text-neg", cyan: "text-cyan" }[tone];
  return (
    <Card className="p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</span>
        <Icon className={cn("size-3.5", color)} />
      </div>
      <div className={cn("num mt-1.5 truncate text-[1.05rem] font-semibold", color)}>{value}</div>
      <div className="h-4">{d !== null && <Delta value={d} className="text-[10px]" />}</div>
    </Card>
  );
}

function DashSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-40" /><Skeleton className="h-9 w-56" /><Skeleton className="h-64" />
      <div className="grid grid-cols-3 gap-2.5"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
      <Skeleton className="h-56" />
    </div>
  );
}
