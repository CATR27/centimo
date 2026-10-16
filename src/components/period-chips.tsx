"use client";

import { Chip } from "@/components/ui/chip";
import { PERIODS, type Period } from "@/lib/dates";

export function PeriodChips({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <div className="flex gap-2" role="group" aria-label="Periodo">
      {PERIODS.map((p) => <Chip key={p} active={value === p} onClick={() => onChange(p)}>{p}</Chip>)}
    </div>
  );
}
