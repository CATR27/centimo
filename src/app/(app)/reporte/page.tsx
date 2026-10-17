"use client";

import { addMonths, endOfMonth, format, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { useMemo, useState } from "react";
import { AnimatedIcon } from "@/components/animated-icon";
import { Avatar } from "@/components/avatar";
import { SpendArea } from "@/components/charts/charts";
import { CategoryIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/misc";
import { byCategory, delta, series, totals } from "@/lib/analytics";
import { fmtDate, toISO } from "@/lib/dates";
import { formatMoney, toMajor } from "@/lib/money";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function Reporte() {
  const { ready, transactions, categories, settings } = useStore();
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const cur = settings.currency;

  const r = useMemo(() => {
    const range = { from: toISO(cursor), to: toISO(endOfMonth(cursor)) };
    const prevC = addMonths(cursor, -1);
    const prev = { from: toISO(prevC), to: toISO(endOfMonth(prevC)) };
    const now = totals(transactions, range);
    const before = totals(transactions, prev);
    const slices = byCategory(transactions, categories, range);
    const monthTx = transactions.filter((t) => t.status === "paid" && !t.transferId && t.date >= range.from && t.date <= range.to);
    const top = monthTx.filter((t) => t.type === "expense").sort((a, b) => b.amount - a.amount).slice(0, 5);
    return { range, now, before, slices, top, monthTx, data: series(transactions, range) };
  }, [transactions, categories, cursor]);

  if (!ready) return <Skeleton className="h-96 rounded-[36px]" />;

  const label = format(cursor, "MMMM yyyy", { locale: es });
  const rate = r.now.income > 0 ? (r.now.net / r.now.income) * 100 : null;
  const days = Math.max(1, new Date(endOfMonth(cursor)).getDate());
  const maxSlice = Math.max(...r.slices.map((s) => s.value), 1);

  const csv = () => {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = [["fecha", "tipo", "categoria", "nota", "monto"], ...r.monthTx.map((t) => [
      t.date, t.type === "income" ? "ingreso" : "gasto", categories.find((c) => c.id === t.categoryId)?.name ?? "", t.note, String(toMajor(t.amount, cur)),
    ])];
    const blob = new Blob(["﻿" + rows.map((x) => x.map(esc).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `centimo-${format(cursor, "yyyy-MM")}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const stats = [
    { label: "Ingresos", value: formatMoney(r.now.income, cur), d: delta(r.now.income, r.before.income), invert: false, cls: "bg-lime text-lime-ink" },
    { label: "Gastos", value: formatMoney(r.now.expense, cur), d: delta(r.now.expense, r.before.expense), invert: true, cls: "bg-surface" },
    { label: "Ahorro", value: rate === null ? "—" : `${rate.toFixed(0)}%`, sub: `${formatMoney(r.now.net, cur)} libres`, cls: "card-dark" },
    { label: "Movimientos", value: String(r.monthTx.length), sub: `${(r.monthTx.length / days).toFixed(1)} por día`, cls: "bg-surface" },
  ];

  return (
    <div className="space-y-3.5">
      <div className="print:hidden">
        <PageHeader title="Reporte" right={
          <button onClick={() => window.print()} aria-label="Imprimir o guardar PDF" className="grid size-12 place-items-center rounded-full bg-surface transition active:scale-95">
            <AnimatedIcon name="importar" className="size-[21px]" />
          </button>
        } />
      </div>

      <div className="flex items-center gap-2 rounded-full bg-surface p-1 print:hidden">
        <button onClick={() => setCursor((c) => addMonths(c, -1))} aria-label="Mes anterior" className="grid size-11 place-items-center rounded-full bg-surface-2 transition active:scale-95"><AnimatedIcon name="izquierda" strokeWidth={2} className="size-5" /></button>
        <span className="flex-1 text-center text-base font-semibold capitalize">{label}</span>
        <button onClick={() => setCursor((c) => addMonths(c, 1))} aria-label="Mes siguiente" className="grid size-11 place-items-center rounded-full bg-surface-2 transition active:scale-95"><AnimatedIcon name="derecha" strokeWidth={2} className="size-5" /></button>
      </div>

      <div className="grid grid-cols-[112px_minmax(0,1fr)] items-center gap-3.5 rounded-[30px] bg-surface p-3 print:hidden">
        <Avatar n={18} className="size-28" />
        <div className="flex flex-col gap-3 py-1 pr-1.5">
          <span className="text-[21px] font-semibold leading-tight capitalize">Tu resumen de {format(cursor, "MMMM", { locale: es })} está listo</span>
          <div className="flex gap-1.5">
            <button onClick={() => window.print()} className="flex h-10 items-center gap-1.5 rounded-full bg-accent px-3.5 text-sm font-semibold text-accent-ink active:scale-95">
              <AnimatedIcon name="importar" strokeWidth={2} className="size-4" idle={false} />PDF
            </button>
            <button onClick={csv} className="grid h-10 place-items-center rounded-full bg-surface-2 px-3.5 text-sm font-semibold active:scale-95">CSV</button>
          </div>
        </div>
      </div>

      <div className="hidden print:block">
        <h1 className="text-3xl font-semibold capitalize">Reporte · {label}</h1>
        <p className="text-sm text-muted">{settings.displayName} · {fmtDate(r.range.from)} – {fmtDate(r.range.to)}</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={cn("flex flex-col gap-0.5 rounded-[26px] p-4 print:border print:border-line", s.cls)}>
            <span className="text-[13px] opacity-65">{s.label}</span>
            <span className="num truncate text-[26px] font-semibold leading-[1.1]">{s.value}</span>
            <span className="num text-xs opacity-65">
              {s.d !== undefined ? (s.d === null ? "—" : `${s.d >= 0 ? "+" : "−"}${Math.abs(s.d).toFixed(0)}% vs mes anterior`) : s.sub}
            </span>
          </div>
        ))}
      </div>

      <Card className="flex flex-col gap-3 p-[18px]">
        <span className="text-[17px] font-semibold">Gasto diario</span>
        <SpendArea data={r.data} currency={cur} height={180} />
      </Card>

      <Card className="flex flex-col gap-3 p-[18px]">
        <span className="text-[17px] font-semibold">Top categorías</span>
        {r.slices.length === 0 ? <p className="text-sm text-muted">Sin gastos este mes.</p> : r.slices.slice(0, 5).map((c) => (
          <div key={c.id} className="flex flex-col gap-1.5">
            <span className="flex justify-between text-sm"><span className="font-semibold">{c.name}</span><span className="num text-ink/60">{formatMoney(c.value, cur)}</span></span>
            <span className="block h-2.5 overflow-hidden rounded-full bg-surface-2"><span className="bar-in block h-full rounded-full" style={{ width: `${(c.value / maxSlice) * 100}%`, background: c.color }} /></span>
          </div>
        ))}
      </Card>

      {r.top.length > 0 && (
        <Card className="px-3.5 py-1.5">
          <div className="px-0.5 pb-1 pt-3 text-[17px] font-semibold">Mayores gastos</div>
          <div className="divide-y divide-line">
            {r.top.map((t) => {
              const cat = categories.find((c) => c.id === t.categoryId);
              return (
                <div key={t.id} className="flex items-center gap-3 py-2.5">
                  <span className="relative grid size-11 shrink-0 place-items-center rounded-full bg-accent text-accent-ink">
                    <CategoryIcon name={cat?.icon ?? "tag"} className="size-[19px]" />
                    <span className="absolute bottom-0 right-0 size-[11px] rounded-full border-2 border-surface" style={{ background: cat?.color ?? "#7b8798" }} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col leading-tight">
                    <span className="truncate text-[15px] font-semibold">{t.note || cat?.name || "Gasto"}</span>
                    <span className="text-xs text-muted">{cat?.name ?? "Sin categoría"} · {fmtDate(t.date, "dd MMM")}</span>
                  </span>
                  <span className="num whitespace-nowrap text-[15px] font-semibold">−{formatMoney(t.amount, cur)}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
