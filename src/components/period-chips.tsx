"use client";

import { cn } from "@/lib/utils";
import { PERIODS, type Period } from "@/lib/dates";

/** Cuatro círculos iguales (7D · 30D · MES · AÑO); el activo es lima. */
export function PeriodChips({ value, onChange, className }: { value: Period; onChange: (p: Period) => void; className?: string }) {
  return (
    <div className={cn("grid grid-cols-4 gap-2", className)} role="group" aria-label="Periodo">
      {PERIODS.map((p) => (
        <button key={p} aria-pressed={value === p} onClick={() => onChange(p)}
          className={cn("grid aspect-square place-items-center rounded-full text-base font-semibold transition active:scale-95 lg:aspect-auto lg:h-14 lg:rounded-full",
            value === p ? "bg-lime text-lime-ink" : "bg-surface text-ink/60 hover:text-ink")}>
          {p}
        </button>
      ))}
    </div>
  );
}
