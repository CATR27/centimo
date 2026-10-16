"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatedIcon, type IconName } from "@/components/animated-icon";
import { BarsMini, BudgetBar, CategoryDonut, SpendArea, Sparkline } from "@/components/charts/charts";
import { PeriodChips } from "@/components/period-chips";
import { useQuickAdd } from "@/components/transactions/quick-add";
import { TxRow } from "@/components/transactions/tx-row";
import { Card, SectionTitle } from "@/components/ui/card";
import { HScroll } from "@/components/ui/hscroll";
import { Delta, EmptyState, Skeleton } from "@/components/ui/misc";
import { budgetStatus, byCategory, delta, series, totals, upcoming } from "@/lib/analytics";
import { periodRanges, relativeDay, today, type Period } from "@/lib/dates";
import { formatCompact, formatMoney } from "@/lib/money";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { ready, transactions, categories, settings, markPaid } = useStore();
  const open = useQuickAdd();
  const [period, setPeriod] = useState<Period>("30D");
  const [tab, setTab] = useState<"proximos" | "recientes">("proximos");
  const cur = settings.currency;

  const d = useMemo(() => {
    const { current, previous, days } = periodRanges(period);
    const now = totals(transactions, current);
    const before = totals(transactions, previous);
    const month = periodRanges("MES").current;
    const spark = series(transactions, current);
    const slices = byCategory(transactions, categories, current);
    const planned = upcoming(transactions);
    return {
      now, before, days, spark, slices, planned,
      budgets: budgetStatus(transactions, categories, month).slice(0, 4),
      soon: planned.slice(0, 6),
      recent: transactions.filter((t) => t.status === "paid").sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6),
      count: transactions.filter((t) => t.status === "paid").length,
    };
  }, [transactions, categories, period]);

  if (!ready) return <DashSkeleton />;

  const elapsed = period === "MES" || period === "AÑO"
    ? Math.max(1, d.spark.filter((p) => p.date <= today()).length) : d.days;
  const dailyAvg = d.now.expense / elapsed;
  const name = settings.displayName.split(" ")[0] || "";
  const top = d.slices[0];
  const next = d.planned[0];
  const rate = d.now.income > 0 ? Math.round((d.now.net / d.now.income) * 100) : null;
  const incBars = d.spark.slice(-14).map((p) => p.income);
  const netLine = d.spark.map((p) => p.expense);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        {/* ── Tarjeta principal (panel salvia) ── */}
        <section className="rounded-[40px] bg-panel p-4 sm:p-6" aria-label="Resumen">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-full bg-accent text-sm font-bold text-accent-ink">
                {(name || "?").slice(0, 1).toUpperCase()}
              </span>
              <span className="text-[15px] font-medium">{name ? `Hola, ${name}` : "Resumen"}</span>
            </div>
            <HScroll className="mt-4 max-w-full"><PeriodChips value={period} onChange={setPeriod} /></HScroll>
            <p className="num mt-5 max-w-full truncate text-[clamp(2.4rem,9vw,4.25rem)] font-semibold leading-none tracking-tight">
              {formatMoney(d.now.expense, cur)}
            </p>
            <p className="mt-2 flex items-center gap-2 text-xs text-ink/60">
              <Delta value={delta(d.now.expense, d.before.expense)} invert />
              gasto · vs {formatCompact(d.before.expense, cur)} antes
            </p>
          </div>

          <div className="mt-5 grid grid-cols-[1fr_1fr] gap-3 sm:grid-cols-[1.4fr_1fr]">
            <button onClick={() => open({ type: "expense" })}
              className="h-14 rounded-full bg-accent text-base font-semibold text-accent-ink transition active:scale-[0.98]">
              Gasto
            </button>
            <button onClick={() => open({ type: "income" })} aria-label="Registrar ingreso"
              className="flex h-14 items-center justify-between gap-2 rounded-full bg-lime pl-5 pr-2 text-base font-semibold text-lime-ink transition active:scale-[0.98]">
              <span>Ingreso</span>
              <span className="grid size-10 place-items-center rounded-full bg-white/60"><Plus className="size-5" /></span>
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="grid gap-3">
              <Link href="/analisis" className="rounded-[28px] bg-surface p-4 shadow-sm transition active:scale-[0.99]">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Ingresos</span>
                  <span className="num text-[11px] text-muted">{period}</span>
                </div>
                <div className="mt-3"><BarsMini values={incBars.length ? incBars : [0]} /></div>
                <p className="num mt-3 truncate text-lg font-semibold">{formatCompact(d.now.income, cur)}</p>
                <Delta value={delta(d.now.income, d.before.income)} />
              </Link>
              <div className="grad-card flex min-h-[9.5rem] flex-col justify-between rounded-[28px] p-4">
                <p className="muted-ink text-xs font-medium">Mayor categoría</p>
                <p className="num text-4xl font-semibold tracking-tight">{top ? top.name.slice(0, 2).toLowerCase() : "—"}</p>
                <div className="border-t border-dashed border-black/25 pt-2">
                  <p className="truncate text-sm font-semibold">{top?.name ?? "Sin gastos"}</p>
                  <p className="muted-ink num text-xs">{top ? `${top.pct.toFixed(0)}% · ${formatCompact(top.value, cur)}` : "Registra un gasto"}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="rounded-[28px] bg-surface p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="grid size-9 place-items-center rounded-full bg-accent text-accent-ink"><AnimatedIcon name="analisis" className="size-4.5" /></span>
                  <div className="min-w-0 leading-tight">
                    <p className="truncate text-sm font-semibold">Balance</p>
                    <p className="text-[11px] text-muted">{period}</p>
                  </div>
                </div>
                <div className="mt-2"><Sparkline values={netLine.length ? netLine : [0, 0]} color="var(--chart)" height={44} /></div>
                <p className={cn("num mt-1 truncate text-lg font-semibold", d.now.net < 0 && "text-neg")}>{formatCompact(d.now.net, cur)}</p>
                <p className="num text-xs text-muted">{rate === null ? "—" : `Ahorro ${rate}%`}</p>
              </div>
              <div className="flex items-center gap-3 rounded-[28px] bg-surface p-3.5 shadow-sm">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-lime text-lime-ink"><AnimatedIcon name="historial" className="size-5" /></span>
                <div className="min-w-0 leading-tight">
                  <p className="text-sm font-semibold">Prom./día</p>
                  <p className="num truncate text-xs text-muted">{formatCompact(dailyAvg, cur)}</p>
                </div>
              </div>
              <Link href="/proximos" className="flex items-center gap-3 rounded-[28px] bg-surface p-3.5 shadow-sm">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-accent-ink"><AnimatedIcon name="proximos" className="size-5" /></span>
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-sm font-semibold">{next ? next.note || "Próximo pago" : "Sin pagos"}</p>
                  <p className="num truncate text-xs text-muted">{next ? `${formatCompact(next.amount, cur)} · ${relativeDay(next.date)}` : "Nada programado"}</p>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Movimientos (pestañas píldora) ── */}
        <Card className="flex flex-col rounded-[40px] p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold tracking-tight">Movimientos</h2>
            <p className="text-sm text-muted">{d.planned.length} por pagar · {d.count} registrados</p>
          </div>
          <div className="grid grid-cols-2 rounded-full border border-line bg-surface p-1" role="tablist">
            {([["proximos", `Próximos (${d.planned.length})`], ["recientes", "Recientes"]] as const).map(([k, l]) => (
              <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                className={cn("h-11 rounded-full text-sm font-semibold transition", tab === k ? "bg-accent text-accent-ink" : "text-ink/70")}>
                {l}
              </button>
            ))}
          </div>
          <div className="mt-3 flex-1 divide-y divide-line/60">
            {(tab === "proximos" ? d.soon : d.recent).length === 0
              ? <EmptyState title={tab === "proximos" ? "Nada programado" : "Aún no hay movimientos"} />
              : (tab === "proximos" ? d.soon : d.recent).map((t) => (
                <TxRow key={t.id} tx={t} showDate onPay={tab === "proximos" ? () => markPaid(t.id) : undefined} />
              ))}
          </div>
          <Link href={tab === "proximos" ? "/proximos" : "/transacciones"} className="mt-3 text-center text-sm font-semibold text-ink/70 hover:text-ink">
            Ver todo →
          </Link>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-[36px]">
          <SectionTitle action={<span className="num rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold text-muted">{period}</span>}>Gasto diario</SectionTitle>
          <SpendArea data={d.spark} currency={cur} height={220} />
        </Card>

        <Card className="rounded-[36px]">
          <SectionTitle action={<Link href="/analisis" className="text-sm font-semibold text-ink/70">Análisis →</Link>}>Por categoría</SectionTitle>
          {d.slices.length === 0 ? <EmptyState title="Sin gastos en este periodo" hint="Registra uno con el botón +" /> : (
            <div className="flex flex-col items-center gap-5 sm:flex-row">
              <CategoryDonut data={d.slices} currency={cur} centerLabel="Total" centerValue={formatCompact(d.now.expense, cur)} size={170} />
              <ul className="w-full flex-1 space-y-2.5">
                {d.slices.slice(0, 5).map((s) => (
                  <li key={s.id} className="flex items-center gap-3">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
                    <span className="min-w-0 flex-1 truncate text-sm">{s.name}</span>
                    <span className="num text-xs text-muted">{s.pct.toFixed(0)}%</span>
                    <span className="num w-20 text-right text-sm font-semibold">{formatCompact(s.value, cur)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>

      {d.budgets.length > 0 && (
        <Card className="rounded-[36px]">
          <SectionTitle action={<Link href="/categorias" className="text-sm font-semibold text-ink/70">Editar →</Link>}>Presupuestos del mes</SectionTitle>
          <ul className="grid gap-5 sm:grid-cols-2">
            {d.budgets.map((b) => (
              <li key={b.category.id}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    <span className="size-2.5 rounded-full" style={{ background: b.category.color }} />{b.category.name}
                  </span>
                  <span className={cn("num text-xs", b.ratio > 1 ? "font-semibold text-neg" : "text-muted")}>
                    {formatCompact(b.spent, cur)} / {formatCompact(b.budget, cur)}
                  </span>
                </div>
                <BudgetBar ratio={b.ratio} color={b.category.color} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Accesos (estilo "Account Settings") */}
      <section aria-label="Accesos">
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="text-[15px] font-semibold">Accesos</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Access href="/transacciones" icon="historial" title="Historial" sub={`${d.count} movimientos`} />
          <Access href="/proximos" icon="proximos" title="Próximos" sub={`${d.planned.length} pendientes`} highlight />
          <Access href="/analisis" icon="analisis" title="Análisis" sub={rate === null ? "Ahorro —" : `Ahorro ${rate}%`} />
          <Access href="/categorias" icon="categorias" title="Categorías" sub={`${categories.length} creadas`} />
          <Access href="/ajustes" icon="ajustes" title="Ajustes" sub={`Moneda ${cur}`} />
        </div>
      </section>
    </div>
  );
}

function Access({ href, icon, title, sub, highlight }: { href: string; icon: IconName; title: string; sub: string; highlight?: boolean }) {
  return (
    <Link href={href}
      className={cn("flex min-h-[7.5rem] flex-col justify-between rounded-[28px] p-4 transition active:scale-[0.98]",
        highlight ? "grad-card" : "neon-card border border-line/70 bg-surface")}>
      <span className={cn("grid size-9 place-items-center rounded-xl", highlight ? "bg-black text-white" : "bg-accent text-accent-ink")}>
        <AnimatedIcon name={icon} className="size-5" />
      </span>
      <span>
        <span className="block text-[15px] font-semibold">{title}</span>
        <span className={cn("num block text-xs", highlight ? "muted-ink" : "text-muted")}>{sub}</span>
      </span>
    </Link>
  );
}

function DashSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <Skeleton className="h-[34rem] rounded-[40px]" />
      <Skeleton className="h-[34rem] rounded-[40px]" />
    </div>
  );
}
