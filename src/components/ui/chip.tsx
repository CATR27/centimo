import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Píldora: blanca; activa en tinta. */
export function Chip({ active, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "grid h-10 shrink-0 place-items-center rounded-full px-4 text-sm font-semibold transition active:scale-[.97]",
        active ? "bg-accent text-accent-ink" : "bg-surface text-ink/60 hover:text-ink",
        className,
      )}
      {...props}
    />
  );
}

/** Selector segmentado en píldora (Entrar/Crear, Gastos/Ingresos, Mes/Trimestre/Año…). */
export function Segmented<T extends string>({ value, onChange, options, tone = "ink", className }: {
  value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; tone?: "ink" | "lime"; className?: string;
}) {
  return (
    <div role="tablist" className={cn("grid gap-1 rounded-full bg-surface p-1", className)} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button key={o.value} role="tab" aria-selected={on} onClick={() => onChange(o.value)}
            className={cn("grid place-items-center rounded-full text-sm font-semibold transition",
              tone === "lime" ? "h-[46px] text-[15px]" : "h-[42px]",
              on ? (tone === "lime" ? "bg-lime text-lime-ink" : "bg-accent text-accent-ink") : "text-ink/60 hover:text-ink")}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
