"use client";

import { addDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { useMemo } from "react";
import { AnimatedIcon } from "@/components/animated-icon";
import { HeroBanner } from "@/components/design";
import { CategoryIcon } from "@/components/icons";
import { PageHeader, RoundAction } from "@/components/page-header";
import { useQuickAdd } from "@/components/transactions/quick-add";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { upcoming } from "@/lib/analytics";
import { daysUntil, parse, relativeDay, toISO } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { useStore } from "@/lib/store";
import type { Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function Proximos() {
  const { ready, transactions, categories, settings, markPaid } = useStore();
  const open = useQuickAdd();
  const cur = settings.currency;

  const { list, due, dueTotal, days } = useMemo(() => {
    const list = upcoming(transactions);
    const due = list.filter((t) => t.type === "expense" && daysUntil(t.date) <= 7);
    const start = new Date();
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = addDays(start, i);
      const iso = toISO(d);
      return { iso, l: format(d, "EEEEE", { locale: es }).toUpperCase(), n: format(d, "d"), today: i === 0, has: list.some((t) => t.date === iso) };
    });
    return { list, due, dueTotal: due.reduce((a, t) => a + t.amount, 0), days };
  }, [transactions]);

  const payAll = () => due.forEach((t) => markPaid(t.id));

  return (
    <div className="space-y-3.5">
      <PageHeader title="Próximos" sub="Pagos programados y recurrentes"
        right={<RoundAction aria-label="Programar pago" onClick={() => open({ status: "planned" })}><AnimatedIcon name="mas" className="size-[21px]" /></RoundAction>} />

      <HeroBanner tone="grad" avatar={2}>
        <span className="text-[13px] font-semibold uppercase tracking-[0.14em] muted-ink">Por pagar · 7 días</span>
        <span className="num truncate text-[32px] font-semibold leading-none">{formatMoney(dueTotal, cur)}</span>
        <span className="muted-ink text-[13px]">{due.length ? `${due.length} pago${due.length === 1 ? "" : "s"} pendiente${due.length === 1 ? "" : "s"} esta semana` : "Todo al día esta semana"}</span>
        {due.length > 0 && (
          <button onClick={payAll}
            className="mt-2.5 flex h-[46px] items-center gap-2.5 self-start whitespace-nowrap rounded-full bg-accent pl-[18px] pr-[5px] text-[15px] font-semibold text-accent-ink transition active:scale-[.97]">
            Pagar todo
            <span className="grid size-9 place-items-center rounded-full bg-lime text-lime-ink"><AnimatedIcon name="check" strokeWidth={2.4} className="size-4" /></span>
          </button>
        )}
      </HeroBanner>

      <div className="grid grid-cols-7 gap-1 rounded-[28px] bg-surface px-1.5 py-2.5">
        {days.map((w) => (
          <span key={w.iso} className="flex flex-col items-center gap-1">
            <span className="text-xs font-semibold text-muted">{w.l}</span>
            <span className={cn("grid size-10 place-items-center rounded-full text-base font-semibold", w.today ? "bg-accent text-lime" : "")}>{w.n}</span>
            <span className={cn("size-1.5 rounded-full", w.has ? "bg-ink" : "bg-transparent")} />
          </span>
        ))}
      </div>

      {!ready ? <Skeleton className="h-48" /> : list.length === 0 ? (
        <EmptyState title="No hay pagos programados" hint="Programa arriendo, suscripciones o cuotas." />
      ) : (
        <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:items-start">
          {list.map((t) => <PayRow key={t.id} t={t} onPay={() => markPaid(t.id)} cats={categories} cur={cur} />)}
        </div>
      )}
    </div>
  );
}

function PayRow({ t, onPay, cats, cur }: { t: Transaction; onPay: () => void; cats: { id: string; name: string; icon: string; color: string }[]; cur: string }) {
  const cat = cats.find((c) => c.id === t.categoryId);
  const d = parse(t.date);
  const overdue = daysUntil(t.date) < 0;
  return (
    <div className="grid grid-cols-[52px_minmax(0,1fr)] gap-2">
      <div className="flex flex-col items-center pt-3">
        <span className="num text-2xl font-semibold leading-none">{format(d, "dd")}</span>
        <span className="text-xs font-semibold uppercase text-muted">{format(d, "MMM", { locale: es })}</span>
      </div>
      <div className="flex items-center gap-2.5 rounded-3xl bg-surface py-3 pl-3 pr-2.5">
        <span className="relative grid size-[42px] shrink-0 place-items-center rounded-full bg-accent text-accent-ink">
          <CategoryIcon name={cat?.icon ?? "tag"} className="size-[18px]" />
          <span className="absolute bottom-0 right-0 size-[11px] rounded-full border-2 border-surface" style={{ background: cat?.color ?? "#7b8798" }} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate text-[15px] font-semibold">{t.note || cat?.name || "Pago"}</span>
          <span className={cn("truncate text-xs", overdue ? "text-neg" : "text-muted")}>{overdue ? "Vencido · " : ""}{relativeDay(t.date)}</span>
        </span>
        <span className="num whitespace-nowrap text-[15px] font-semibold">{t.type === "income" ? "+" : "−"}{formatMoney(t.amount, cur)}</span>
        <button onClick={onPay} aria-label="Marcar como pagado"
          className="group size-9 shrink-0 rounded-full shadow-[inset_0_0_0_2px_var(--text)] transition hover:bg-lime hover:shadow-none active:scale-90">
          <span className="grid size-full place-items-center opacity-0 transition group-hover:opacity-100"><AnimatedIcon name="check" strokeWidth={2.4} className="size-4 text-lime-ink" idle={false} /></span>
        </button>
      </div>
    </div>
  );
}
