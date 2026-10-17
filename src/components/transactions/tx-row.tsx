"use client";

import { Repeat } from "lucide-react";
import { AnimatedIcon } from "@/components/animated-icon";
import { CategoryIcon } from "@/components/icons";
import { relativeDay } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { useStore } from "@/lib/store";
import type { Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useQuickAdd } from "./quick-add";

/** Fila del diseño: círculo de tinta con icono + punto de color de la categoría, importe tabular y check lima. */
export function TxRow({ tx, showDate = false, onPay }: { tx: Transaction; showDate?: boolean; onPay?: () => void }) {
  const { categories, settings } = useStore();
  const open = useQuickAdd();
  const cat = categories.find((c) => c.id === tx.categoryId);
  const color = tx.transferId ? "#7b8798" : cat?.color ?? "#7b8798";
  const label = tx.transferId ? "Transferencia" : cat?.name ?? "Sin categoría";
  const income = tx.type === "income";

  return (
    <div className="flex items-center gap-3 py-2.5">
      <button onClick={() => open({ tx })} className="flex min-w-0 flex-1 items-center gap-3 text-left active:opacity-70">
        <span className="relative grid size-11 shrink-0 place-items-center rounded-full bg-accent text-accent-ink">
          <CategoryIcon name={tx.transferId ? "repeat" : cat?.icon ?? "tag"} className="size-[19px]" />
          <span className="absolute bottom-0 right-0 size-[11px] rounded-full border-2 border-surface" style={{ background: color }} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate text-[15px] font-semibold">{tx.note || label}</span>
          <span className="flex items-center gap-1.5 truncate text-xs text-muted">
            {label}
            {showDate && <> · {relativeDay(tx.date)}</>}
            {tx.tags?.slice(0, 2).map((g) => <span key={g}> #{g}</span>)}
            {tx.recurrence && <Repeat className="size-3" aria-label="Recurrente" />}
          </span>
        </span>
        <span className={cn("num shrink-0 text-[15px] font-semibold", income ? "text-pos" : "text-ink")}>
          {income ? "+" : "−"}{formatMoney(tx.amount, settings.currency)}
        </span>
      </button>
      {onPay && (
        <button onClick={onPay} aria-label="Marcar como pagado"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-lime text-lime-ink transition active:scale-90">
          <AnimatedIcon name="check" strokeWidth={2.4} className="size-4" />
        </button>
      )}
    </div>
  );
}
