"use client";

import { Check } from "lucide-react";
import { useMemo } from "react";
import { CategoryIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { relativeDay } from "@/lib/dates";
import { formatCompact, formatMoney } from "@/lib/money";
import { useStore } from "@/lib/store";
import { PERIOD_LABEL, detectSubscriptions } from "@/lib/subscriptions";

export default function Suscripciones() {
  const { ready, transactions, categories, settings, markPaid } = useStore();
  const cur = settings.currency;
  const subs = useMemo(() => detectSubscriptions(transactions), [transactions]);
  const monthly = subs.reduce((a, s) => a + s.monthlyCost, 0);

  if (!ready) return <Skeleton className="h-96 rounded-[36px]" />;

  return (
    <div>
      <PageHeader title="Suscripciones" sub="Pagos recurrentes detectados automáticamente" />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Card className="grad-card rounded-[32px] border-0 lg:col-span-1">
          <p className="muted-ink text-xs font-medium">Costo mensual</p>
          <p className="num mt-2 truncate text-3xl font-semibold">{formatMoney(monthly, cur)}</p>
        </Card>
        <Card className="rounded-[32px]">
          <p className="text-xs font-medium text-muted">Costo anual</p>
          <p className="num mt-2 truncate text-2xl font-semibold">{formatCompact(monthly * 12, cur)}</p>
        </Card>
        <Card className="col-span-2 rounded-[32px] lg:col-span-1">
          <p className="text-xs font-medium text-muted">Detectadas</p>
          <p className="num mt-2 text-2xl font-semibold">{subs.length}</p>
        </Card>
      </div>

      {subs.length === 0 ? (
        <EmptyState title="Aún no hay pagos recurrentes" hint="Programa un pago con repetición o registra el mismo gasto 3 veces." />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {subs.map((s) => {
            const cat = categories.find((c) => c.id === s.categoryId);
            const color = cat?.color ?? "#8a9693";
            return (
              <Card key={s.key} className="flex items-center gap-3 rounded-[28px] p-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-full" style={{ background: `color-mix(in srgb, ${color} 18%, transparent)`, color }}>
                  <CategoryIcon name={cat?.icon ?? "repeat"} className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold first-letter:uppercase">{s.name}</p>
                  <p className="num truncate text-xs text-muted">
                    {PERIOD_LABEL[s.period]} · {formatMoney(s.amount, cur)}{s.next ? ` · próximo ${relativeDay(s.next)}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="num text-sm font-semibold">{formatCompact(s.monthlyCost, cur)}</p>
                  <p className="text-[11px] text-muted">al mes</p>
                </div>
                {s.plannedId && (
                  <button onClick={() => markPaid(s.plannedId!)} aria-label="Marcar como pagado"
                    className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-accent-ink active:opacity-80">
                    <Check className="size-5" />
                  </button>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
