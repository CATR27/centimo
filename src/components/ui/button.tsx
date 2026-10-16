import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "outline" | "danger";
const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-ink font-semibold active:brightness-90",
  ghost: "text-ink hover:bg-surface-2 active:bg-surface-2",
  outline: "border border-line text-ink hover:bg-surface-2 active:bg-surface-2",
  danger: "border border-neg/40 text-neg hover:bg-neg/10 active:bg-neg/10",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "md" | "lg" | "icon";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", type = "button", ...props }, ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 rounded-xl text-sm transition disabled:pointer-events-none disabled:opacity-50",
        size === "md" && "h-11 px-4",
        size === "lg" && "h-12 px-5 text-base",
        size === "icon" && "size-11",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
});
