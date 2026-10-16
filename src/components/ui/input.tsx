import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props }, ref,
) {
  // text-base (16px) evita el zoom automático de iOS al enfocar.
  return (
    <input
      ref={ref}
      className={cn(
        "h-12 w-full rounded-xl border border-line bg-surface-2 px-3.5 text-base text-ink outline-none transition placeholder:text-muted/70 focus:border-accent",
        className,
      )}
      {...props}
    />
  );
});

export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      {children}
      {error && <span role="alert" className="mt-1 block text-xs text-neg">{error}</span>}
    </label>
  );
}
