"use client";

import { Check, Repeat } from "lucide-react";
import { CategoryIcon } from "@/components/icons";
import { relativeDay } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { useStore } from "@/lib/store";
import type { Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useQuickAdd } from "./quick-add";

export function TxRow({ tx, showDate = false, onPay }: { tx: Transaction; showDate?: boolean; onPay?: () => void }) {
  const { categories, settings } = useStore();
  const open = useQuickAdd();
  const cat = categories.find((c) => c.id === tx.categoryId);
  const color = tx.transferId ? "#7b8798" : cat?.color ?? "#7b8798";
  const label = tx.transferId ? "Transferencia" : cat?.name ?? "Sin categoría";
  const income = tx.type === "income";

  return (
    <div className="flex items-center gap-1">
      <button onClick={() => open({ tx })} className="flex min-h-16 min-w-0 flex-1 items-center gap-3 rounded-2xl py-2 text-left active:bg-surface-2">
        <span className="grid size-12 shrink-0 place-items-center rounded-full"
          style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}>
          <CategoryIcon name={tx.transferId ? "repeat" : cat?.icon ?? "tag"} className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{tx.note || label}</span>
          <span className="flex items-center gap-1.5 truncate text-xs text-muted">
            {label}
            {showDate && <> · {relativeDay(tx.date)}</>}
            {tx.tags?.slice(0, 2).map((g) => <span key={g} className="text-ink/50"> #{g}</span>)}
            {tx.recurrence && <Repeat className="size-3" aria-label="Recurrente" />}
          </span>
        </span>
        <span className={cn("num shrink-0 text-sm font-semibold", income ? "text-pos" : "text-ink")}>
          {income ? "+" : "−"}{formatMoney(tx.amount, settings.currency)}
        </span>
      </button>
      {onPay && (
        <button onClick={onPay} aria-label="Marcar como pagado"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-accent-ink active:opacity-80">
          <Check className="size-5" />
        </button>
      )}
    </div>
  );
}
