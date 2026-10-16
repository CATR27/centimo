"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { AnimatedIcon } from "@/components/animated-icon";
import { NAV_GROUPS } from "@/components/layout/nav-config";
import { useQuickAdd } from "@/components/transactions/quick-add";
import { Delta, Skeleton } from "@/components/ui/misc";
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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">{name ? `Hola, ${name}` : "Hub"}</h1>
        <p className="text-sm text-muted">Todo tu dinero en un solo lugar</p>
      </header>

      {/* Estado del mes */}
      <section className="rounded-[40px] bg-panel p-5" aria-label="Estado del mes">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/50">Este mes</p>
        <p className="num mt-2 truncate text-[clamp(2.2rem,10vw,3.5rem)] font-semibold leading-none tracking-tight">{formatMoney(m.now.expense, cur)}</p>
        <p className="mt-2 flex items-center gap-2 text-xs text-ink/60">
          <Delta value={delta(m.now.expense, m.before.expense)} invert /> de gasto vs mes anterior
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button onClick={() => open({ type: "expense" })} className="h-14 rounded-full bg-accent text-base font-semibold text-accent-ink active:scale-[0.98]">Gasto</button>
          <button onClick={() => open({ type: "income" })}
            className="flex h-14 items-center justify-between rounded-full bg-lime pl-5 pr-2 text-base font-semibold text-lime-ink active:scale-[0.98]">
            Ingreso <span className="grid size-10 place-items-center rounded-full bg-white/60"><Plus className="size-5" /></span>
          </button>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
          <Stat label="Ingresos" value={formatCompact(m.now.income, cur)} />
          <Stat label="Balance" value={formatCompact(m.now.net, cur)} tone={m.now.net < 0 ? "neg" : undefined} />
          <Stat label="Próximo" value={m.next ? relativeDay(m.next.date) : "—"} sub={m.next ? formatCompact(m.next.amount, cur) : undefined} />
        </div>
      </section>

      <InsightsCard limit={3} />
      <BudgetAlertsCard />

      {/* Accesos */}
      {sections.map((g) => (
        <section key={g.title} aria-label={g.title}>
          <h2 className="mb-3 px-1 text-xs font-bold uppercase tracking-[0.14em] text-muted">{g.title}</h2>
          <div className="grid grid-cols-3 gap-3">
            {g.items.map((n) => (
              <Link key={n.href} href={n.href}
                className="neon-card flex aspect-square flex-col items-center justify-center gap-3 rounded-[28px] border border-line/70 bg-surface p-3 text-center transition active:scale-[0.97]">
                <span className="grid size-12 place-items-center rounded-full bg-accent text-accent-ink">
                  <AnimatedIcon name={n.icon} className="size-6" />
                </span>
                <span className="text-[13px] font-semibold leading-tight">{n.label}</span>
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
    <div className="rounded-[24px] bg-surface px-2 py-3 shadow-sm">
      <p className="text-[11px] font-medium text-muted">{label}</p>
      <p className={cn("num mt-1 truncate text-[15px] font-semibold", tone === "neg" && "text-neg")}>{value}</p>
      {sub && <p className="num text-[11px] text-muted">{sub}</p>}
    </div>
  );
}
