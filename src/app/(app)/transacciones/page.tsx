"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useMemo, useState } from "react";
import { AnimatedIcon } from "@/components/animated-icon";
import { HeroBanner } from "@/components/design";
import { PageHeader, RoundAction } from "@/components/page-header";
import { TxRow } from "@/components/transactions/tx-row";
import { Chip } from "@/components/ui/chip";
import { PillInput } from "@/components/ui/input";
import { HScroll } from "@/components/ui/hscroll";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { totals } from "@/lib/analytics";
import { dayHeading, periodRanges } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { useStore } from "@/lib/store";
import type { Transaction, TxType } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function Transacciones() {
  const { ready, transactions, categories, settings } = useStore();
  const [q, setQ] = useState("");
  const [type, setType] = useState<TxType | "all">("all");
  const [cat, setCat] = useState<string | "all">("all");
  const [tag, setTag] = useState<string | null>(null);
  const [limit, setLimit] = useState(60);
  const [more, setMore] = useState(false);
  const cur = settings.currency;

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return transactions
      .filter((t) => t.status === "paid")
      .filter((t) => type === "all" || t.type === type)
      .filter((t) => cat === "all" || t.categoryId === cat)
      .filter((t) => !tag || (t.tags ?? []).includes(tag))
      .filter((t) => !needle || t.note.toLowerCase().includes(needle) || (categories.find((c) => c.id === t.categoryId)?.name.toLowerCase().includes(needle) ?? false))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, categories, q, type, cat, tag]);
  const allTags = useMemo(() => [...new Set(transactions.flatMap((t) => t.tags ?? []))].sort(), [transactions]);
  const month = useMemo(() => totals(transactions, periodRanges("MES").current), [transactions]);
  const monthCount = useMemo(() => {
    const r = periodRanges("MES").current;
    return transactions.filter((t) => t.status === "paid" && t.date >= r.from && t.date <= r.to).length;
  }, [transactions]);

  const groups = useMemo(() => {
    const m = new Map<string, Transaction[]>();
    for (const t of filtered.slice(0, limit)) m.set(t.date, [...(m.get(t.date) ?? []), t]);
    return [...m.entries()];
  }, [filtered, limit]);

  return (
    <div className="space-y-3.5">
      <PageHeader title="Historial" sub={`${filtered.length} movimientos`}
        right={<RoundAction aria-label="Más filtros" aria-pressed={more} onClick={() => setMore((v) => !v)} className={cn(more && "bg-lime text-lime-ink")}>
          <AnimatedIcon name="filtro" className="size-[21px]" />
        </RoundAction>} />

      <HeroBanner tone="lime" avatar={9}>
        <span className="text-[13px] font-semibold uppercase tracking-[0.14em] muted-ink">{format(new Date(), "MMMM", { locale: es })} · {monthCount} mov.</span>
        <span className="num truncate text-[32px] font-semibold leading-none">−{formatMoney(month.expense, cur)}</span>
        <span className="num text-sm font-semibold text-[#1f7a5c]">+{formatMoney(month.income, cur)} ingresos</span>
      </HeroBanner>

      <PillInput icon={<AnimatedIcon name="buscar" className="size-[19px]" />} value={q} onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar movimiento" inputMode="search" wrapClassName="h-[54px]" />

      <HScroll className="flex gap-1.5">
        {([["all", "Todo"], ["expense", "Gastos"], ["income", "Ingresos"]] as const).map(([v, l]) => (
          <Chip key={v} active={type === v} onClick={() => setType(v)}>{l}</Chip>
        ))}
        {more && <>
          <span className="mx-1 w-px shrink-0 bg-line" />
          <Chip active={cat === "all"} onClick={() => setCat("all")}>Todas</Chip>
          {categories.map((c) => <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>{c.name}</Chip>)}
          {allTags.length > 0 && <span className="mx-1 w-px shrink-0 bg-line" />}
          {allTags.map((g) => <Chip key={g} active={tag === g} onClick={() => setTag(tag === g ? null : g)}>#{g}</Chip>)}
        </>}
      </HScroll>

      {!ready ? <div className="space-y-2"><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
        : groups.length === 0 ? <EmptyState title="Sin resultados" hint="Prueba con otros filtros." /> : (
        <div className="grid items-start gap-3.5 lg:grid-cols-2">
          {groups.map(([date, list]) => {
            const net = list.reduce((a, t) => a + (t.type === "income" ? t.amount : -t.amount), 0);
            return (
              <section key={date} className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-1.5">
                  <h2 className="whitespace-nowrap text-[15px] font-semibold lowercase first-letter:uppercase">{dayHeading(date)}</h2>
                  <span className="num whitespace-nowrap text-[13px] text-muted">{net < 0 ? "−" : "+"}{formatMoney(Math.abs(net), cur)}</span>
                </div>
                <div className="divide-y divide-line rounded-[26px] bg-surface px-3.5 py-1">
                  {list.map((t) => <TxRow key={t.id} tx={t} />)}
                </div>
              </section>
            );
          })}
          {filtered.length > limit && (
            <button onClick={() => setLimit((l) => l + 60)} className="h-12 w-full rounded-full bg-surface text-sm font-semibold text-muted lg:col-span-2">
              Cargar más
            </button>
          )}
        </div>
      )}
    </div>
  );
}
