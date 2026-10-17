"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatedIcon } from "@/components/animated-icon";
import { Avatar } from "@/components/avatar";
import { SpendArea, WeekdayBars } from "@/components/charts/charts";
import { Donut } from "@/components/design";
import { PageHeader, RoundAction } from "@/components/page-header";
import { InsightsCard } from "@/components/widgets";
import { Card, SectionTitle } from "@/components/ui/card";
import { Chip, Segmented } from "@/components/ui/chip";
import { Delta, EmptyState, Skeleton } from "@/components/ui/misc";
import { byCategory, delta, series, totals, weekdayPattern } from "@/lib/analytics";
import { periodRanges, type Period } from "@/lib/dates";
import { formatCompact } from "@/lib/money";
import { useStore } from "@/lib/store";

type AP = "MES" | "TRI" | "AÑO";
const SUB: Record<AP, string> = { MES: "Este mes", TRI: "Últimos 3 meses", AÑO: "Este año" };
const VS: Record<AP, string> = { MES: "el mes anterior", TRI: "el trimestre anterior", AÑO: "el año anterior" };

export default function Analisis() {
  const { ready, transactions, categories, settings } = useStore();
  const [period, setPeriod] = useState<AP>("MES");
  const [mode, setMode] = useState<"daily" | "cumulative">("daily");
  const cur = settings.currency;

  const a = useMemo(() => {
    const { current, previous, days } = periodRanges(period as Period);
    const now = totals(transactions, current);
    const before = totals(transactions, previous);
    const slices = byCategory(transactions, categories, current);
    const prevSlices = byCategory(transactions, categories, previous);
    const movers = slices.map((s) => {
      const prev = prevSlices.find((p) => p.id === s.id)?.value ?? 0;
      return { ...s, prev, change: delta(s.value, prev) };
    });
    const week = weekdayPattern(transactions, current);
    const peak = week.reduce((m, w) => (w.avg > m.avg ? w : m), week[0]);
    const rate = now.income > 0 ? (now.net / now.income) * 100 : null;
    return { now, before, slices, movers, week, peak, rate, days, data: series(transactions, current) };
  }, [transactions, categories, period]);

  if (!ready) return <div className="space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-72" /><Skeleton className="h-64" /></div>;

  const top = a.movers.slice(0, 5);
  const cmax = Math.max(...top.flatMap((m) => [m.value, m.prev]), 1);
  const dailyAvg = a.now.expense / Math.max(1, a.data.filter((p) => p.expense > 0).length || a.days);

  return (
    <div className="grid gap-3.5 lg:grid-cols-2">
      <div className="space-y-3.5 lg:col-span-2">
        <PageHeader title="Análisis" right={
          <Link href="/ajustes" aria-label="Ajustes"><RoundAction tabIndex={-1}><AnimatedIcon name="ajustes" className="size-[21px]" /></RoundAction></Link>
        } />
        <Segmented value={period} onChange={setPeriod} options={[{ value: "MES", label: "Mes" }, { value: "TRI", label: "Trimestre" }, { value: "AÑO", label: "Año" }]} />
      </div>

      <Card className="flex flex-col gap-1.5 p-[18px]">
        <div className="grid grid-cols-[minmax(0,1fr)_112px] items-center gap-3">
          <span className="flex flex-col gap-0.5 pt-1">
            <span className="text-[21px] font-semibold leading-tight">¿A dónde se va tu dinero?</span>
            <span className="text-[13px] text-muted">{SUB[period]}</span>
          </span>
          <Avatar n={3} className="size-28" />
        </div>
        {a.slices.length === 0 ? <EmptyState title="Sin datos en este periodo" /> : (
          <div className="grid grid-cols-[150px_minmax(0,1fr)] items-center gap-4">
            <Donut slices={a.slices} size={150}>
              <span className="text-xs text-muted">Total</span>
              <span className="num whitespace-nowrap text-[19px] font-semibold">{formatCompact(a.now.expense, cur)}</span>
            </Donut>
            <div className="flex flex-col gap-[9px]">
              {a.slices.slice(0, 5).map((s) => (
                <span key={s.id} className="flex items-center gap-2 text-sm">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
                  <span className="flex-1 truncate">{s.name}</span>
                  <span className="num font-semibold">{s.pct.toFixed(0)}%</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>

      <div className="card-dark flex flex-col gap-3.5 rounded-[28px] p-[18px]">
        <div className="flex items-center justify-between">
          <span className="text-[17px] font-semibold">Frente a {VS[period]}</span>
          <span className="flex gap-2.5 text-xs text-dk-muted">
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#3a4644]" />Antes</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-lime" />Ahora</span>
          </span>
        </div>
        {top.length === 0 ? <p className="py-6 text-center text-sm text-dk-muted">Sin datos para comparar</p> : (
          <div className="grid h-[130px] items-end gap-2.5" style={{ gridTemplateColumns: `repeat(${top.length}, minmax(0, 1fr))` }}>
            {top.map((c) => (
              <div key={c.id} className="flex h-full flex-col items-center justify-end gap-1.5">
                <div className="flex h-full items-end gap-1">
                  <span className="grow-y w-3.5 rounded-full bg-[#3a4644]" style={{ height: `${Math.max(4, (c.prev / cmax) * 100)}%` }} />
                  <span className="grow-y w-3.5 rounded-full bg-lime" style={{ height: `${Math.max(4, (c.value / cmax) * 100)}%`, animationDelay: "90ms" }} />
                </div>
                <span className="w-full truncate text-center text-[11px] text-dk-muted">{c.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5 lg:col-span-2">
        <Card className="flex flex-col gap-0.5 rounded-[26px] p-4">
          <span className="text-[13px] text-muted">Día más caro</span>
          <span className="text-2xl font-semibold">{a.peak.avg > 0 ? a.peak.label : "—"}</span>
          <span className="num text-[13px] text-ink/60">{formatCompact(a.peak.avg, cur)} en promedio</span>
        </Card>
        <div className="flex flex-col gap-0.5 rounded-[26px] bg-lime p-4 text-lime-ink">
          <span className="muted-ink text-[13px]">Promedio diario</span>
          <span className="num text-2xl font-semibold">{formatCompact(dailyAvg, cur)}</span>
          <span className="muted-ink num text-[13px]"><Delta value={delta(a.now.expense, a.before.expense)} invert className="!text-lime-ink" /> vs anterior</span>
        </div>
      </div>

      <Card>
        <SectionTitle action={
          <div className="flex gap-1.5">
            <Chip active={mode === "daily"} onClick={() => setMode("daily")} className="h-8 px-2.5">Diario</Chip>
            <Chip active={mode === "cumulative"} onClick={() => setMode("cumulative")} className="h-8 px-2.5">Acumulado</Chip>
          </div>
        }>Evolución</SectionTitle>
        <SpendArea data={a.data} currency={cur} cumulative={mode === "cumulative"} height={230} color="var(--chart)" compare={mode === "daily"} />
      </Card>

      <Card>
        <SectionTitle>Gasto promedio por día de la semana</SectionTitle>
        <WeekdayBars data={a.week} currency={cur} />
        <p className="num mt-2 text-xs text-muted">Tasa de ahorro {a.rate === null ? "—" : `${a.rate.toFixed(0)}%`} · Balance {formatCompact(a.now.net, cur)}</p>
      </Card>

      <InsightsCard limit={6} className="lg:col-span-2" />
    </div>
  );
}
