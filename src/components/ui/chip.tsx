import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Chip({ active, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "num h-9 shrink-0 rounded-lg border px-3.5 text-xs font-medium transition",
        active ? "border-accent/60 bg-accent/15 text-accent" : "border-line text-muted hover:text-ink",
        className,
      )}
      {...props}
    />
  );
}
