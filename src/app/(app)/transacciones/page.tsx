"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { TxRow } from "@/components/transactions/tx-row";
import { Chip } from "@/components/ui/chip";
import { HScroll } from "@/components/ui/hscroll";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { dayHeading } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { useStore } from "@/lib/store";
import type { Transaction, TxType } from "@/lib/types";

export default function Transacciones() {
  const { ready, transactions, categories, settings } = useStore();
  const [q, setQ] = useState("");
  const [type, setType] = useState<TxType | "all">("all");
  const [cat, setCat] = useState<string | "all">("all");
  const [tag, setTag] = useState<string | null>(null);
  const [limit, setLimit] = useState(60);

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

  const groups = useMemo(() => {
    const m = new Map<string, Transaction[]>();
    for (const t of filtered.slice(0, limit)) m.set(t.date, [...(m.get(t.date) ?? []), t]);
    return [...m.entries()];
  }, [filtered, limit]);

  return (
    <div>
      <PageHeader title="Historial" sub={`${filtered.length} movimientos`} />
      <div className="sticky top-[calc(4.75rem+env(safe-area-inset-top))] z-20 -mx-4 space-y-2.5 bg-bg/90 px-4 pb-3 pt-1 backdrop-blur lg:top-0">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar nota o categoría" inputMode="search"
            className="h-12 w-full rounded-xl border border-line bg-surface pl-10 pr-3 text-base outline-none focus:border-accent"
          />
        </div>
        <HScroll className="flex gap-2">
          {([["all", "Todo"], ["expense", "Gastos"], ["income", "Ingresos"]] as const).map(([v, l]) => (
            <Chip key={v} active={type === v} onClick={() => setType(v)}>{l}</Chip>
          ))}
          <span className="mx-1 w-px shrink-0 bg-line" />
          <Chip active={cat === "all"} onClick={() => setCat("all")}>Todas</Chip>
          {categories.map((c) => (
            <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>{c.name}</Chip>
          ))}
          {allTags.length > 0 && <span className="mx-1 w-px shrink-0 bg-line" />}
          {allTags.map((g) => (
            <Chip key={g} active={tag === g} onClick={() => setTag(tag === g ? null : g)}>#{g}</Chip>
          ))}
        </HScroll>
      </div>

      {!ready ? <div className="space-y-2"><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
        : groups.length === 0 ? <EmptyState title="Sin resultados" hint="Prueba con otros filtros." /> : (
        <div className="grid items-start gap-5 lg:grid-cols-2">
          {groups.map(([date, list]) => {
            const net = list.reduce((a, t) => a + (t.type === "income" ? t.amount : -t.amount), 0);
            return (
              <section key={date}>
                <div className="mb-1 flex items-center justify-between px-1 text-xs">
                  <h2 className="font-semibold lowercase text-muted first-letter:uppercase">{dayHeading(date)}</h2>
                  <span className="num text-muted">{net < 0 ? "−" : "+"}{formatMoney(Math.abs(net), settings.currency)}</span>
                </div>
                <div className="divide-y divide-line/60 rounded-3xl border border-line bg-surface px-3">
                  {list.map((t) => <TxRow key={t.id} tx={t} />)}
                </div>
              </section>
            );
          })}
          {filtered.length > limit && (
            <button onClick={() => setLimit((l) => l + 60)} className="h-12 w-full lg:col-span-2 rounded-xl border border-line text-sm text-muted">
              Cargar más
            </button>
          )}
        </div>
      )}
    </div>
  );
}
