"use client";

import { Flame, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { CategoryDonut, SpendArea, WeekdayBars } from "@/components/charts/charts";
import { PageHeader } from "@/components/page-header";
import { PeriodChips } from "@/components/period-chips";
import { HScroll } from "@/components/ui/hscroll";
import { Card, SectionTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Delta, EmptyState, Skeleton } from "@/components/ui/misc";
import { byCategory, delta, series, totals, weekdayPattern } from "@/lib/analytics";
import { periodRanges, type Period } from "@/lib/dates";
import { formatCompact, formatMoney } from "@/lib/money";
import { useStore } from "@/lib/store";

export default function Analisis() {
  const { ready, transactions, categories, settings } = useStore();
  const [period, setPeriod] = useState<Period>("30D");
  const [mode, setMode] = useState<"daily" | "cumulative">("daily");
  const cur = settings.currency;

  const a = useMemo(() => {
    const { current, previous } = periodRanges(period);
    const now = totals(transactions, current);
    const before = totals(transactions, previous);
    const slices = byCategory(transactions, categories, current);
    const prevSlices = byCategory(transactions, categories, previous);
    const movers = slices.map((s) => ({
      ...s, change: delta(s.value, prevSlices.find((p) => p.id === s.id)?.value ?? 0),
    }));
    const biggest = transactions
      .filter((t) => t.status === "paid" && t.type === "expense" && t.date >= current.from && t.date <= current.to)
      .sort((x, y) => y.amount - x.amount).slice(0, 3);
    const week = weekdayPattern(transactions, current);
    const rate = now.income > 0 ? (now.net / now.income) * 100 : null;
    return { now, before, slices, movers, biggest, week, rate, data: series(transactions, current), count: slices.reduce((s, x) => s + x.count, 0) };
  }, [transactions, categories, period]);

  if (!ready) return <div className="space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-72" /><Skeleton className="h-64" /></div>;

  const peak = [...a.week].sort((x, y) => y.avg - x.avg)[0];
  const top = a.slices[0];

  return (
    <div className="space-y-4">
      <PageHeader title="Análisis" sub="Entiende en qué se va tu dinero" />
      <HScroll className="-mx-4 px-4"><PeriodChips value={period} onChange={setPeriod} /></HScroll>

      <div className="grid grid-cols-2 gap-2.5">
        <Card className="p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Gastado</p>
          <p className="num mt-1 text-xl font-semibold text-neg">{formatCompact(a.now.expense, cur)}</p>
          <Delta value={delta(a.now.expense, a.before.expense)} invert />
        </Card>
        <Card className="p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Tasa de ahorro</p>
          <p className="num mt-1 text-xl font-semibold text-pos">{a.rate === null ? "—" : `${a.rate.toFixed(0)}%`}</p>
          <span className="num text-xs text-muted">Balance {formatCompact(a.now.net, cur)}</span>
        </Card>
      </div>

      <Card>
        <SectionTitle action={
          <div className="flex gap-1.5">
            <Chip active={mode === "daily"} onClick={() => setMode("daily")} className="h-8 px-2.5">Diario</Chip>
            <Chip active={mode === "cumulative"} onClick={() => setMode("cumulative")} className="h-8 px-2.5">Acumulado</Chip>
          </div>
        }>Evolución</SectionTitle>
        <SpendArea data={a.data} currency={cur} cumulative={mode === "cumulative"} height={230} color="var(--chart)" compare={mode === "daily"} />
        <div className="num mt-2 flex gap-4 text-[11px] text-muted">
          <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-chart" /> Gasto</span>
          {mode === "daily" && <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-ink" /> Ingreso</span>}
        </div>
      </Card>

      <Card>
        <SectionTitle>Distribución</SectionTitle>
        {a.slices.length === 0 ? <EmptyState title="Sin datos en este periodo" /> : (
          <>
            <CategoryDonut data={a.slices} currency={cur} centerLabel={`${a.count} mov.`} centerValue={formatCompact(a.now.expense, cur)} size={210} />
            <ul className="mt-5 space-y-3">
              {a.movers.map((s) => (
                <li key={s.id} className="flex items-center gap-3">
                  <span className="size-2.5 rounded-full" style={{ background: s.color }} />
                  <span className="min-w-0 flex-1 truncate text-sm">{s.name}</span>
                  <Delta value={s.change} invert className="w-16 justify-end" />
                  <span className="num w-20 text-right text-sm font-medium">{formatCompact(s.value, cur)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <Card>
        <SectionTitle>Gasto promedio por día de la semana</SectionTitle>
        <WeekdayBars data={a.week} currency={cur} />
      </Card>

      {top && peak && (
        <Card className="space-y-3">
          <SectionTitle>Insights</SectionTitle>
          <Insight Icon={Flame} color="text-amber">
            <b>{top.name}</b> concentra el {top.pct.toFixed(0)}% de tu gasto ({formatMoney(top.value, cur)}).
          </Insight>
          <Insight Icon={peak.avg > 0 ? TrendingUp : TrendingDown} color="text-cyan">
            Gastas más los <b>{peak.label}</b>: en promedio {formatMoney(Math.round(peak.avg), cur)}.
          </Insight>
          {a.biggest[0] && (
            <Insight Icon={TrendingUp} color="text-neg">
              Mayor gasto: <b>{a.biggest[0].note || "Sin nota"}</b> por {formatMoney(a.biggest[0].amount, cur)}.
            </Insight>
          )}
        </Card>
      )}
    </div>
  );
}

function Insight({ Icon, color, children }: { Icon: typeof Flame; color: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <Icon className={`mt-0.5 size-4 shrink-0 ${color}`} />
      <p className="text-muted [&_b]:font-semibold [&_b]:text-ink">{children}</p>
    </div>
  );
}
