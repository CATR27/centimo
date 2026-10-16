import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Píldora: gris suave; activa en negro (lima en oscuro). */
export function Chip({ active, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "h-10 shrink-0 rounded-full px-4 text-[13px] font-semibold transition",
        active ? "bg-accent text-accent-ink" : "bg-surface-2 text-muted hover:text-ink",
        className,
      )}
      {...props}
    />
  );
}
