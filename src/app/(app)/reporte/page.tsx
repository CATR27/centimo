"use client";

import { addMonths, endOfMonth, format, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import { CategoryDonut, SpendArea } from "@/components/charts/charts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/misc";
import { byCategory, delta, series, totals } from "@/lib/analytics";
import { fmtDate, toISO } from "@/lib/dates";
import { formatCompact, formatMoney } from "@/lib/money";
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
    const prevSlices = byCategory(transactions, categories, prev);
    const top = transactions
      .filter((t) => t.status === "paid" && t.type === "expense" && !t.transferId && t.date >= range.from && t.date <= range.to)
      .sort((a, b) => b.amount - a.amount).slice(0, 5);
    return { range, now, before, slices, prevSlices, top, data: series(transactions, range) };
  }, [transactions, categories, cursor]);

  if (!ready) return <Skeleton className="h-96 rounded-[36px]" />;

  const label = format(cursor, "MMMM yyyy", { locale: es });
  const rate = r.now.income > 0 ? (r.now.net / r.now.income) * 100 : null;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reporte mensual</h1>
          <p className="text-sm text-muted">Resumen listo para imprimir o guardar en PDF</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCursor((c) => addMonths(c, -1))} aria-label="Mes anterior" className="grid size-11 place-items-center rounded-full bg-surface"><ChevronLeft className="size-5" /></button>
          <span className="min-w-32 text-center text-sm font-semibold capitalize">{label}</span>
          <button onClick={() => setCursor((c) => addMonths(c, 1))} aria-label="Mes siguiente" className="grid size-11 place-items-center rounded-full bg-surface"><ChevronRight className="size-5" /></button>
          <Button onClick={() => window.print()}><Printer className="size-4" /> Imprimir / PDF</Button>
        </div>
      </div>

      <article className="mx-auto max-w-4xl space-y-6 rounded-[36px] bg-surface p-6 shadow-sm sm:p-10 print:max-w-none print:rounded-none print:p-0 print:shadow-none" aria-label={`Reporte de ${label}`}>
        <header className="flex items-end justify-between border-b border-line pb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Centimo · Reporte</p>
            <h2 className="mt-1 text-3xl font-semibold capitalize tracking-tight">{label}</h2>
          </div>
          <p className="text-right text-xs text-muted">{settings.displayName}<br />{fmtDate(r.range.from)} – {fmtDate(r.range.to)}</p>
        </header>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi label="Ingresos" value={formatMoney(r.now.income, cur)} d={delta(r.now.income, r.before.income)} />
          <Kpi label="Gastos" value={formatMoney(r.now.expense, cur)} d={delta(r.now.expense, r.before.expense)} invert />
          <Kpi label="Balance" value={formatMoney(r.now.net, cur)} tone={r.now.net < 0 ? "neg" : undefined} />
          <Kpi label="Tasa de ahorro" value={rate === null ? "—" : `${rate.toFixed(0)}%`} />
        </section>

        <section>
          <h3 className="mb-2 text-sm font-semibold">Gasto diario</h3>
          <SpendArea data={r.data} currency={cur} height={200} />
        </section>

        <section className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
          {r.slices.length > 0 && <CategoryDonut data={r.slices} currency={cur} centerLabel="Total" centerValue={formatCompact(r.now.expense, cur)} size={170} />}
          <div>
            <h3 className="mb-2 text-sm font-semibold">Gasto por categoría</h3>
            {r.slices.length === 0 ? <p className="text-sm text-muted">Sin gastos este mes.</p> : (
              <table className="w-full text-sm">
                <tbody>
                  {r.slices.map((s) => {
                    const p = r.prevSlices.find((x) => x.id === s.id)?.value ?? 0;
                    const ch = delta(s.value, p);
                    return (
                      <tr key={s.id} className="border-b border-line/60 last:border-0">
                        <td className="py-2"><span className="mr-2 inline-block size-2.5 rounded-full align-middle" style={{ background: s.color }} />{s.name}</td>
                        <td className="num py-2 text-right text-muted">{s.pct.toFixed(0)}%</td>
                        <td className={cn("num py-2 text-right text-xs", ch === null ? "text-muted" : ch > 0 ? "text-neg" : "text-pos")}>{ch === null ? "—" : `${ch >= 0 ? "▲" : "▼"}${Math.abs(ch).toFixed(0)}%`}</td>
                        <td className="num py-2 text-right font-semibold">{formatMoney(s.value, cur)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {r.top.length > 0 && (
          <section>
            <h3 className="mb-2 text-sm font-semibold">Mayores gastos</h3>
            <table className="w-full text-sm">
              <tbody>
                {r.top.map((t) => (
                  <tr key={t.id} className="border-b border-line/60 last:border-0">
                    <td className="py-2">{t.note || categories.find((c) => c.id === t.categoryId)?.name || "Gasto"}</td>
                    <td className="py-2 text-muted">{fmtDate(t.date, "d MMM")}</td>
                    <td className="num py-2 text-right font-semibold">{formatMoney(t.amount, cur)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </article>
    </div>
  );
}

function Kpi({ label, value, d, invert, tone }: { label: string; value: string; d?: number | null; invert?: boolean; tone?: "neg" }) {
  const good = d == null ? null : invert ? d <= 0 : d >= 0;
  return (
    <div className="rounded-3xl bg-surface-2 p-4 print:border print:border-line">
      <p className="text-[11px] font-medium text-muted">{label}</p>
      <p className={cn("num mt-1 truncate text-lg font-semibold", tone === "neg" && "text-neg")}>{value}</p>
      {d != null && <p className={cn("num text-xs font-semibold", good ? "text-pos" : "text-neg")}>{d >= 0 ? "▲" : "▼"} {Math.abs(d).toFixed(1)}% vs mes anterior</p>}
    </div>
  );
}
