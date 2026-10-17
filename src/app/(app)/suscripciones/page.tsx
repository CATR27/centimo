"use client";

import { useMemo } from "react";
import { AnimatedIcon } from "@/components/animated-icon";
import { Avatar } from "@/components/avatar";
import { PageHeader } from "@/components/page-header";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { relativeDay } from "@/lib/dates";
import { formatCompact, formatMoney } from "@/lib/money";
import { useStore } from "@/lib/store";
import { PERIOD_LABEL, detectSubscriptions } from "@/lib/subscriptions";

const PALETTE = ["#e50914", "#1db954", "#2a4bd7", "#3a3f44", "#ff3d2e", "#10a37f", "#a78bfa", "#ff6b35"];

export default function Suscripciones() {
  const { ready, transactions, categories, settings, markPaid } = useStore();
  const cur = settings.currency;
  const subs = useMemo(() => detectSubscriptions(transactions), [transactions]);
  const monthly = subs.reduce((a, s) => a + s.monthlyCost, 0);

  if (!ready) return <Skeleton className="h-96 rounded-[36px]" />;

  const colored = subs.map((s, i) => ({ s, color: categories.find((c) => c.id === s.categoryId)?.color ?? PALETTE[i % PALETTE.length], pal: PALETTE[i % PALETTE.length] }));
  const priciest = [...subs].sort((a, b) => b.monthlyCost - a.monthlyCost)[0];

  return (
    <div className="space-y-3.5">
      <PageHeader title="Suscripciones" sub="Pagos recurrentes detectados" />

      <div className="flex flex-col gap-3.5 rounded-[30px] bg-lime p-[18px] text-lime-ink">
        <div className="grid grid-cols-[minmax(0,1fr)_112px] items-center gap-3">
          <span className="flex min-w-0 flex-col gap-1">
            <span className="text-[13px] font-semibold uppercase tracking-[0.14em] muted-ink">Al mes</span>
            <span className="num truncate text-[32px] font-semibold leading-none">{formatMoney(monthly, cur)}</span>
            <span className="muted-ink num text-[13px]">{formatMoney(monthly * 12, cur)} al año · {subs.length} activa{subs.length === 1 ? "" : "s"}</span>
          </span>
          <Avatar n={8} className="size-28" />
        </div>
        {subs.length > 0 && (
          <span className="flex h-3.5 gap-[3px]" aria-hidden>
            {colored.map(({ s, pal }) => <span key={s.key} className="bar-in rounded-full" style={{ flex: s.monthlyCost, background: pal }} />)}
          </span>
        )}
      </div>

      {priciest && subs.length > 1 && (
        <div className="flex items-center gap-3 rounded-full bg-surface py-2.5 pl-4 pr-2.5">
          <span className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate text-[15px] font-semibold first-letter:uppercase">{priciest.name} es tu pago más alto</span>
            <span className="num text-xs text-muted">{formatMoney(priciest.yearlyCost, cur)} al año</span>
          </span>
        </div>
      )}

      {subs.length === 0 ? (
        <EmptyState title="Aún no hay pagos recurrentes" hint="Programa un pago con repetición o registra el mismo gasto 3 veces." />
      ) : (
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
          {colored.map(({ s, pal }) => (
            <div key={s.key} className="flex flex-col gap-2.5 rounded-[26px] bg-surface p-3.5">
              <div className="flex items-start justify-between">
                <span className="grid size-11 place-items-center rounded-full text-lg font-bold text-white" style={{ background: pal }}>{s.name.slice(0, 1).toUpperCase()}</span>
                {s.next && <span className="whitespace-nowrap rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold">{relativeDay(s.next)}</span>}
              </div>
              <span className="flex flex-col leading-[1.15]">
                <span className="truncate text-[15px] font-semibold first-letter:uppercase">{s.name}</span>
                <span className="num text-xl font-semibold">{formatCompact(s.amount, cur)}</span>
                <span className="text-xs text-muted">{PERIOD_LABEL[s.period]}</span>
              </span>
              {s.plannedId && (
                <button onClick={() => markPaid(s.plannedId!)} aria-label="Marcar como pagado"
                  className="flex h-9 items-center justify-center gap-1.5 rounded-full bg-lime text-[13px] font-semibold text-lime-ink active:scale-95">
                  <AnimatedIcon name="check" strokeWidth={2.4} className="size-3.5" idle={false} /> Pagar
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
