"use client";

import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { useQuickAdd } from "@/components/transactions/quick-add";
import { TxRow } from "@/components/transactions/tx-row";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { dayHeading, toISO, today } from "@/lib/dates";
import { formatCompact, formatMoney } from "@/lib/money";
import { useStore } from "@/lib/store";
import type { Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";

const WEEK = ["L", "M", "X", "J", "V", "S", "D"];

export default function Calendario() {
  const { ready, transactions, settings } = useStore();
  const open = useQuickAdd();
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(today());
  const cur = settings.currency;

  const byDay = useMemo(() => {
    const m = new Map<string, Transaction[]>();
    for (const t of transactions) m.set(t.date, [...(m.get(t.date) ?? []), t]);
    return m;
  }, [transactions]);

  const days = useMemo(
    () => eachDayOfInterval({ start: startOfWeek(cursor, { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }) }),
    [cursor],
  );

  const stats = useMemo(() => {
    let spent = 0, income = 0, planned = 0, max = 0;
    for (const d of days) {
      if (!isSameMonth(d, cursor)) continue;
      const list = (byDay.get(toISO(d)) ?? []).filter((t) => !t.transferId);
      const day = list.filter((t) => t.status === "paid" && t.type === "expense").reduce((a, t) => a + t.amount, 0);
      spent += day; max = Math.max(max, day);
      income += list.filter((t) => t.status === "paid" && t.type === "income").reduce((a, t) => a + t.amount, 0);
      planned += list.filter((t) => t.status === "planned" && t.type === "expense").reduce((a, t) => a + t.amount, 0);
    }
    return { spent, income, planned, max };
  }, [days, byDay, cursor]);

  if (!ready) return <Skeleton className="h-[34rem] rounded-[36px]" />;

  const dayList = (byDay.get(selected) ?? []).slice().sort((a, b) => a.status.localeCompare(b.status));
  const monthLabel = format(cursor, "MMMM yyyy", { locale: es });

  return (
    <div>
      <PageHeader title="Calendario" sub="Tu mes día a día"
        right={<Button onClick={() => open({ date: selected })}><Plus className="size-4" /> Añadir</Button>} />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card className="rounded-[36px] p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <button onClick={() => setCursor((c) => addMonths(c, -1))} aria-label="Mes anterior" className="grid size-11 place-items-center rounded-full bg-surface-2 hover:bg-line"><ChevronLeft className="size-5" /></button>
            <h2 className="text-lg font-semibold capitalize">{monthLabel}</h2>
            <button onClick={() => setCursor((c) => addMonths(c, 1))} aria-label="Mes siguiente" className="grid size-11 place-items-center rounded-full bg-surface-2 hover:bg-line"><ChevronRight className="size-5" /></button>
          </div>

          <div className="mb-4 grid grid-cols-3 gap-2 text-center">
            <Mini label="Gastado" value={formatCompact(stats.spent, cur)} />
            <Mini label="Ingresos" value={formatCompact(stats.income, cur)} />
            <Mini label="Por pagar" value={formatCompact(stats.planned, cur)} />
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted">
            {WEEK.map((w) => <span key={w} className="py-1">{w}</span>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1" role="grid" aria-label={monthLabel}>
            {days.map((d) => {
              const iso = toISO(d);
              const list = (byDay.get(iso) ?? []).filter((t) => !t.transferId);
              const spent = list.filter((t) => t.status === "paid" && t.type === "expense").reduce((a, t) => a + t.amount, 0);
              const inMonth = isSameMonth(d, cursor);
              const heat = stats.max > 0 ? Math.min(1, spent / stats.max) : 0;
              const isSel = iso === selected;
              const isToday = iso === today();
              return (
                <button key={iso} role="gridcell" onClick={() => setSelected(iso)} aria-selected={isSel}
                  aria-label={`${format(d, "d 'de' MMMM", { locale: es })}${spent ? `, gastado ${formatMoney(spent, cur)}` : ""}`}
                  className={cn("relative flex aspect-square min-h-[3rem] flex-col items-center justify-start rounded-2xl p-1 text-sm transition",
                    !inMonth && "opacity-30", isSel ? "bg-accent text-accent-ink" : "bg-surface-2 hover:bg-line/70",
                    isToday && !isSel && "ring-2 ring-ink/70")}
                  style={!isSel && heat > 0 ? { background: `color-mix(in srgb, var(--chart) ${Math.round(heat * 38) + 8}%, var(--surface-2))` } : undefined}>
                  <span className="num font-semibold">{format(d, "d")}</span>
                  <span className="mt-auto flex gap-0.5">
                    {list.some((t) => t.status === "paid" && t.type === "expense") && <i className={cn("size-1.5 rounded-full", isSel ? "bg-accent-ink" : "bg-ink")} />}
                    {list.some((t) => t.status === "paid" && t.type === "income") && <i className="size-1.5 rounded-full bg-pos" />}
                    {list.some((t) => t.status === "planned") && <i className={cn("size-1.5 rounded-full border", isSel ? "border-accent-ink" : "border-ink")} />}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted">
            <span className="flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-ink" /> Gasto</span>
            <span className="flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-pos" /> Ingreso</span>
            <span className="flex items-center gap-1.5"><i className="size-1.5 rounded-full border border-ink" /> Programado</span>
            <span>El tono verde indica más gasto ese día.</span>
          </p>
        </Card>

        <Card className="rounded-[36px] p-5 sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold capitalize">{dayHeading(selected)}</h2>
              <p className="text-sm text-muted">{dayList.length} {dayList.length === 1 ? "movimiento" : "movimientos"}</p>
            </div>
            <Button variant="outline" size="icon" aria-label="Añadir en este día" onClick={() => open({ date: selected })}><Plus className="size-5" /></Button>
          </div>
          {dayList.length === 0 ? <EmptyState title="Sin movimientos" hint="Toca + para añadir uno en este día." /> : (
            <div className="divide-y divide-line/60">{dayList.map((t) => <TxRow key={t.id} tx={t} />)}</div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface-2 px-2 py-2.5">
      <p className="text-[11px] text-muted">{label}</p>
      <p className="num truncate text-sm font-semibold">{value}</p>
    </div>
  );
}
