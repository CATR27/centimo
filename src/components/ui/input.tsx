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
        "h-[54px] w-full rounded-full border border-transparent bg-surface-2 px-5 text-base text-ink outline-none transition placeholder:text-muted/80 focus:border-ink/40 focus:bg-surface",
        className,
      )}
      {...props}
    />
  );
});

/** Entrada del diseño: píldora blanca con círculo de icono a la izquierda y acción opcional a la derecha. */
export const PillInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { icon: ReactNode; end?: ReactNode; wrapClassName?: string }>(
  function PillInput({ icon, end, className, wrapClassName, ...props }, ref) {
    return (
      <label className={cn("flex h-[58px] items-center gap-3 rounded-full bg-surface px-2 transition focus-within:shadow-[inset_0_0_0_2px_var(--text)]", wrapClassName)}>
        <span className="grid size-[42px] shrink-0 place-items-center rounded-full bg-dk text-white">{icon}</span>
        <input ref={ref} className={cn("min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted", className)} {...props} />
        {end}
      </label>
    );
  },
);

export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block px-2 text-xs font-medium text-muted">{label}</span>
      {children}
      {error && <span role="alert" className="mt-1 block px-2 text-xs text-neg">{error}</span>}
    </label>
  );
}
