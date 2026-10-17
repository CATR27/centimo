"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AnimatedIcon } from "@/components/animated-icon";
import { Avatar } from "@/components/avatar";
import { NAV_GROUPS } from "@/components/layout/nav-config";
import { useQuickAdd } from "@/components/transactions/quick-add";
import { Skeleton } from "@/components/ui/misc";
import { BudgetAlertsCard, InsightsCard } from "@/components/widgets";
import { delta, totals, upcoming } from "@/lib/analytics";
import { periodRanges, relativeDay } from "@/lib/dates";
import { formatCompact, formatMoney } from "@/lib/money";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function Hub() {
  const { ready, transactions, settings } = useStore();
  const open = useQuickAdd();
  const cur = settings.currency;

  const m = useMemo(() => {
    const { current, previous } = periodRanges("MES");
    const now = totals(transactions, current);
    const before = totals(transactions, previous);
    return { now, before, next: upcoming(transactions)[0] };
  }, [transactions]);

  if (!ready) return <Skeleton className="h-[28rem] rounded-[40px]" />;

  const name = settings.displayName.split(" ")[0];
  const sections = NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => i.href !== "/hub") })).filter((g) => g.items.length);
  const dl = delta(m.now.expense, m.before.expense);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <header className="flex items-center gap-3">
        <span className="flex flex-1 flex-col">
          <span className="text-[32px] font-semibold leading-[1.05]">{name ? `Hola, ${name}` : "Hub"}</span>
          <span className="text-[15px] text-muted">Todo tu dinero en un solo lugar</span>
        </span>
        <Avatar n={11} className="size-16" />
      </header>

      {/* Estado del mes */}
      <section className="grad-card rounded-[32px] p-[18px]" aria-label="Estado del mes">
        <span className="text-[13px] font-semibold uppercase tracking-[0.14em] muted-ink">Este mes</span>
        <p className="num mt-1.5 truncate text-[44px] font-semibold leading-none">{formatMoney(m.now.expense, cur)}</p>
        <p className="muted-ink mt-1.5 text-[13px]">
          <span className="num font-bold">{dl === null ? "—" : `${dl <= 0 ? "▼" : "▲"} ${Math.abs(dl).toFixed(1)}%`}</span> de gasto vs mes anterior
        </p>

        <div className="mt-3.5 grid grid-cols-2 gap-2">
          <button onClick={() => open({ type: "expense" })} className="grid h-[54px] place-items-center rounded-full bg-accent text-base font-semibold text-accent-ink active:scale-[0.98]">Gasto</button>
          <button onClick={() => open({ type: "income" })}
            className="flex h-[54px] items-center justify-between rounded-full bg-white pl-5 pr-[7px] text-base font-semibold text-[#0a0d0c] active:scale-[0.98]">
            Ingreso <span className="grid size-10 place-items-center rounded-full bg-[#0a0d0c] text-lime"><AnimatedIcon name="nuevo" strokeWidth={2.4} className="size-[18px]" /></span>
          </button>
        </div>

        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          <Stat label="Ingresos" value={formatCompact(m.now.income, cur)} />
          <Stat label="Balance" value={formatCompact(m.now.net, cur)} tone={m.now.net < 0 ? "neg" : undefined} />
          <Stat label="Próximo" value={m.next ? relativeDay(m.next.date) : "—"} sub={m.next ? formatCompact(m.next.amount, cur) : undefined} />
        </div>
      </section>

      <InsightsCard limit={3} />
      <BudgetAlertsCard />

      {/* Accesos circulares */}
      {sections.map((g) => (
        <section key={g.title} aria-label={g.title} className="flex flex-col gap-2.5">
          <h2 className="px-1 text-[13px] font-bold uppercase tracking-[0.16em] text-muted">{g.title}</h2>
          <div className="grid grid-cols-4 gap-x-1.5 gap-y-3">
            {g.items.map((n) => (
              <Link key={n.href} href={n.href} className="group flex flex-col items-center gap-1.5 text-center text-[13px] font-semibold transition active:scale-95">
                <span className="grid size-[66px] place-items-center rounded-full bg-surface transition group-hover:bg-lime group-hover:text-lime-ink">
                  <AnimatedIcon name={n.icon} className="size-6" />
                </span>
                {n.label}
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "neg" }) {
  return (
    <div className="flex flex-col rounded-[22px] bg-white/75 px-2 py-2.5 text-center text-[#0a0d0c]">
      <span className="text-[11px] text-[#5d6865]">{label}</span>
      <span className={cn("num truncate text-base font-semibold", tone === "neg" && "text-[#d6456f]")}>{value}</span>
      {sub && <span className="num text-[11px] text-[#5d6865]">{sub}</span>}
    </div>
  );
}
