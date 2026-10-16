"use client";

import { Plus } from "lucide-react";
import { useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { TxRow } from "@/components/transactions/tx-row";
import { useQuickAdd } from "@/components/transactions/quick-add";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { upcoming } from "@/lib/analytics";
import { daysUntil, fmtDate, relativeDay } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function Proximos() {
  const { ready, transactions, settings, markPaid } = useStore();
  const open = useQuickAdd();
  const cur = settings.currency;

  const { overdue, week, month, later, total30 } = useMemo(() => {
    const list = upcoming(transactions);
    const n = (d: string) => daysUntil(d);
    return {
      overdue: list.filter((t) => n(t.date) < 0),
      week: list.filter((t) => n(t.date) >= 0 && n(t.date) <= 7),
      month: list.filter((t) => n(t.date) > 7 && n(t.date) <= 30),
      later: list.filter((t) => n(t.date) > 30),
      total30: list.filter((t) => t.type === "expense" && n(t.date) <= 30).reduce((a, t) => a + t.amount, 0),
    };
  }, [transactions]);

  const groups = [
    { title: "Vencidos", list: overdue, tone: "text-neg" },
    { title: "Esta semana", list: week, tone: "text-amber" },
    { title: "Este mes", list: month, tone: "text-cyan" },
    { title: "Más adelante", list: later, tone: "text-muted" },
  ].filter((g) => g.list.length);

  return (
    <div className="space-y-4">
      <PageHeader title="Próximos" sub="Pagos programados y recurrentes"
        right={<Button size="md" onClick={() => open({ status: "planned" })}><Plus className="size-4" /> Programar</Button>} />

      <Card className="relative overflow-hidden">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Comprometido · 30 días</p>
        <p className="num mt-1 text-3xl font-semibold text-amber">{formatMoney(total30, cur)}</p>
      </Card>

      {!ready ? <Skeleton className="h-48" /> : groups.length === 0 ? (
        <EmptyState title="No hay pagos programados" hint="Programa arriendo, suscripciones o cuotas." />
      ) : groups.map((g) => (
        <section key={g.title}>
          <div className="mb-1 flex items-center justify-between px-1">
            <h2 className={cn("text-[11px] font-semibold uppercase tracking-[0.14em]", g.tone)}>{g.title}</h2>
            <span className="num text-xs text-muted">{formatMoney(g.list.reduce((a, t) => a + t.amount, 0), cur)}</span>
          </div>
          <div className="divide-y divide-line/60 rounded-3xl border border-line bg-surface px-3">
            {g.list.map((t) => (
              <div key={t.id}>
                <TxRow tx={t} showDate onPay={() => markPaid(t.id)} />
                <p className="num -mt-1 pb-2 pl-14 text-[10.5px] text-muted">{relativeDay(t.date)} · {fmtDate(t.date)}</p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
