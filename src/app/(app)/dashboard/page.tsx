"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatedIcon, type IconName } from "@/components/animated-icon";
import { Avatar } from "@/components/avatar";
import { DotBar, LineArea } from "@/components/design";
import { PeriodChips } from "@/components/period-chips";
import { useQuickAdd } from "@/components/transactions/quick-add";
import { TxRow } from "@/components/transactions/tx-row";
import { Card } from "@/components/ui/card";
import { Segmented } from "@/components/ui/chip";
import { EmptyState, PrivacyToggle, Skeleton, ThemeToggleIcon } from "@/components/ui/misc";
import { BudgetAlertsCard, InsightsCard, SubscriptionsCard } from "@/components/widgets";
import { byCategory, delta, series, totals, upcoming } from "@/lib/analytics";
import { parse, periodRanges, today, type Period } from "@/lib/dates";
import { formatCompact, formatMoney } from "@/lib/money";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const LIME_BLOCK = "var(--lime)";

export default function Dashboard() {
  const { ready, transactions, categories, settings, markPaid, demo } = useStore();
  const open = useQuickAdd();
  const [period, setPeriod] = useState<Period>("30D");
  const [tab, setTab] = useState<"proximos" | "recientes">("proximos");
  const cur = settings.currency;

  const d = useMemo(() => {
    const { current, previous, days } = periodRanges(period);
    const now = totals(transactions, current);
    const before = totals(transactions, previous);
    const spark = series(transactions, current);
    const slices = byCategory(transactions, categories, current);
    const planned = upcoming(transactions);
    return {
      now, before, days, spark, slices, planned,
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
  const dl = delta(d.now.expense, d.before.expense);
  const rate = d.now.income > 0 ? Math.round((d.now.net / d.now.income) * 100) : null;
  const week = d.spark.slice(-7);
  const wmax = Math.max(...week.map((p) => p.expense), 1);
  const tabItems = tab === "proximos" ? d.soon : d.recent;
  const label = period === "AÑO" ? "año" : period === "MES" ? "mes" : period;

  return (
    <div className="space-y-3.5 lg:space-y-5">
      {/* Cabecera */}
      <div className="flex items-center gap-3">
        <span className="grid size-[50px] shrink-0 place-items-center rounded-full border-2 border-ink bg-lime text-xl font-bold text-lime-ink">
          {(name || "?").slice(0, 1).toUpperCase()}
        </span>
        <span className="flex flex-1 flex-col leading-tight">
          <span className="text-[13px] text-muted">{name || "Resumen"}{demo && " · DEMO"}</span>
          <span className="text-[21px] font-semibold lg:text-3xl">Hola de nuevo</span>
        </span>
        <PrivacyToggle className="lg:hidden" />
        <ThemeToggleIcon className="lg:hidden" />
      </div>

      <div className="grid gap-3.5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,0.8fr)]">
        {/* Columna 1: periodo, tarjeta de gasto, accesos, aviso */}
        <div className="space-y-3.5 lg:space-y-5">
          <PeriodChips value={period} onChange={setPeriod} />

          <div className="card-dark grid grid-cols-[minmax(0,1fr)_54px] gap-3 rounded-[30px] py-5 pl-5 pr-[18px]">
            <div className="flex min-w-0 flex-col">
              <span className="text-[13px] uppercase tracking-[0.14em] text-dk-muted">Gasto · {period}</span>
              <span className="num mt-1.5 truncate text-[38px] font-semibold leading-none">{formatMoney(d.now.expense, cur)}</span>
              <span className="mt-1.5 whitespace-nowrap text-[13px] text-dk-muted">
                <span className={cn("num font-semibold", dl === null ? "text-dk-muted" : dl <= 0 ? "text-[#6fe3b4]" : "text-[#ff7a9c]")}>
                  {dl === null ? "—" : `${dl <= 0 ? "▼" : "▲"} ${Math.abs(dl).toFixed(1)}%`}
                </span>{" "}vs {formatCompact(d.before.expense, cur)} antes
              </span>
              <LineArea values={d.spark.map((p) => p.expense)} className="mt-3" />
              <div className="mt-3 flex gap-[22px]">
                <span className="flex min-w-0 flex-col"><span className="text-xs text-dk-muted">Ingresos</span><span className="num truncate text-[17px] font-semibold">{formatCompact(d.now.income, cur)}</span></span>
                <span className="flex min-w-0 flex-col"><span className="text-xs text-dk-muted">Balance</span><span className={cn("num truncate text-[17px] font-semibold", d.now.net < 0 && "text-[#ff7a9c]")}>{formatCompact(d.now.net, cur)}</span></span>
              </div>
            </div>
            <Link href="/analisis" aria-label="Análisis"
              className="flex min-h-0 flex-col items-center justify-between gap-2.5 rounded-full bg-lime px-0 pb-4 pt-2 text-lime-ink transition active:scale-[.98]">
              <span className="grid size-[38px] place-items-center rounded-full bg-dk text-lime"><AnimatedIcon name="analisis" className="size-[19px]" /></span>
              <span className="text-[13px] font-semibold tracking-[0.02em]" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>Análisis</span>
            </Link>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <Quick onClick={() => open({ type: "expense" })} icon="gasto" label="Gasto" />
            <Quick onClick={() => open({ type: "income" })} icon="ingreso" label="Ingreso" />
            <Quick href="/calendario" icon="calendario" label="Calendario" />
            <Quick href="/hub" icon="hub" label="Más" lime />
          </div>

          <div className="grid grid-cols-[112px_minmax(0,1fr)] items-center gap-3.5 rounded-[28px] bg-surface p-2.5">
            <Avatar n={7} className="size-28" />
            <div className="flex flex-col gap-1.5 py-1 pr-2">
              <span className="text-lg font-semibold leading-tight">
                {dl === null ? "Aún sin periodo anterior para comparar" : (<>Gastas <span className="rounded-md bg-lime px-1.5 text-lime-ink">{dl <= 0 ? "▼" : "▲"} {Math.abs(dl).toFixed(1)}%</span> {dl <= 0 ? "menos" : "más"} que en el periodo anterior</>)}
              </span>
              <Link href="/analisis" className="text-sm font-semibold text-ink/60">Ver análisis ›</Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="grad-card flex flex-col gap-2 rounded-[28px] p-4">
              <span className="flex items-center justify-between text-sm font-semibold">
                Ahorro<span className="grid size-[26px] place-items-center rounded-full bg-dk text-[11px] text-lime">▲</span>
              </span>
              <span className="num text-[40px] font-semibold leading-none">{rate === null ? "—" : `${rate}%`}</span>
              <span className="muted-ink text-xs leading-snug">De tus ingresos quedan libres en {label}.</span>
              <span className="num mt-0.5 flex justify-between text-xs font-semibold">Gasto/día<span>{formatCompact(dailyAvg, cur)}</span></span>
              <DotBar on={rate === null ? 0 : Math.max(0, Math.min(10, Math.round(rate / 10)))} total={10} className="bg-white" />
            </div>
            <div className="card-dark flex flex-col gap-2 rounded-[28px] p-4">
              <span className="text-sm font-semibold">Por categoría</span>
              <span className="num truncate text-2xl font-semibold leading-none">
                {d.slices[0] ? <>{d.slices[0].name} <span className="text-lime">{d.slices[0].pct.toFixed(0)}%</span></> : "Sin gastos"}
              </span>
              <div className="mt-1 flex flex-col gap-[7px]">
                {d.slices.slice(0, 4).map((c) => (
                  <div key={c.id} className="flex flex-col gap-[3px]">
                    <span className="flex justify-between text-[11px] text-dk-muted"><span className="truncate">{c.name}</span><span className="num">{c.pct.toFixed(0)}%</span></span>
                    <span className="block h-1.5 overflow-hidden rounded-full bg-dk-3"><span className="bar-in block h-full rounded-full" style={{ width: `${c.pct}%`, background: c.color }} /></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Columna 2: gasto diario y movimientos */}
        <div className="space-y-3.5 lg:space-y-5">
          <Card className="px-4 pb-3 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-[17px] font-semibold">Gasto diario</span>
              <span className="num text-[13px] text-muted">Prom. {formatCompact(dailyAvg, cur)}</span>
            </div>
            <div className="mt-3 grid h-[130px] grid-cols-7 items-end gap-2">
              {week.map((p, i) => {
                const n = p.expense > 0 ? Math.max(1, Math.round((p.expense / wmax) * 7)) : 0;
                const lime = Math.ceil(n * 0.55);
                return (
                  <div key={p.date} className="flex flex-col items-stretch gap-[3px]">
                    {Array.from({ length: n }, (_, k) => (
                      <span key={k} className="blk h-[15px] rounded-[5px]" style={{ background: k >= n - lime ? LIME_BLOCK : "var(--text)", animationDelay: `${(i * 3 + (n - k)) * 28}ms` }} />
                    ))}
                    {n === 0 && <span className="h-[15px] rounded-[5px] bg-surface-2" />}
                    <span className="mt-1 text-center text-[11px] font-semibold uppercase text-muted">{format(parse(p.date), "EEEEE", { locale: es })}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          <div>
            <div className="flex items-end justify-between px-1 pb-3 pt-1">
              <span className="flex flex-col"><span className="text-xl font-semibold">Movimientos</span><span className="text-[13px] text-muted">{d.planned.length} por pagar · {d.count} registrados</span></span>
              <Link href={tab === "proximos" ? "/proximos" : "/transacciones"} className="text-sm font-semibold">Ver todo ›</Link>
            </div>
            <Segmented value={tab} onChange={setTab}
              options={[{ value: "proximos", label: `Próximos (${d.planned.length})` }, { value: "recientes", label: "Recientes" }]} />
            <Card className="mt-3.5 px-3.5 py-1.5">
              {tabItems.length === 0
                ? <EmptyState title={tab === "proximos" ? "Nada programado" : "Aún no hay movimientos"} />
                : <div className="divide-y divide-line">{tabItems.map((t) => (
                  <TxRow key={t.id} tx={t} showDate onPay={tab === "proximos" ? () => markPaid(t.id) : undefined} />
                ))}</div>}
            </Card>
          </div>
        </div>

        {/* Columna 3: hallazgos, presupuestos, suscripciones */}
        <div className="grid content-start gap-3.5 lg:col-span-2 lg:grid-cols-2 lg:gap-5 xl:col-span-1 xl:grid-cols-1">
          <InsightsCard />
          <BudgetAlertsCard />
          <SubscriptionsCard className="lg:col-span-2 xl:col-span-1" />
        </div>
      </div>
    </div>
  );
}

function Quick({ icon, label, href, onClick, lime }: { icon: IconName; label: string; href?: string; onClick?: () => void; lime?: boolean }) {
  const cls = cn("flex aspect-square flex-col items-center justify-center gap-1 rounded-full text-[13px] font-semibold transition active:scale-95",
    lime ? "bg-lime text-lime-ink" : "bg-surface");
  const inner = (<><AnimatedIcon name={icon} strokeWidth={1.9} className="size-[22px]" />{label}</>);
  return href ? <Link href={href} className={cls}>{inner}</Link> : <button onClick={onClick} className={cls}>{inner}</button>;
}

function DashSkeleton() {
  return (
    <div className="space-y-3.5" aria-busy>
      <Skeleton className="h-[50px] w-2/3 rounded-full" />
      <div className="grid grid-cols-4 gap-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="aspect-square rounded-full" />)}</div>
      <Skeleton className="h-72 rounded-[30px]" />
      <Skeleton className="h-28 rounded-[28px]" />
    </div>
  );
}
