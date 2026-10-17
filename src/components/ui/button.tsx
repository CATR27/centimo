import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "lime" | "ghost" | "outline" | "danger";
const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-ink font-semibold active:opacity-85",
  lime: "bg-lime text-lime-ink font-semibold active:opacity-85",
  ghost: "text-ink hover:bg-surface-2 active:bg-surface-2",
  outline: "bg-surface text-ink hover:bg-surface-2 active:bg-surface-2",
  danger: "bg-neg/10 text-neg hover:bg-neg/15 active:bg-neg/15",
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
        "inline-flex select-none items-center justify-center gap-2 rounded-full text-sm transition disabled:pointer-events-none disabled:opacity-40",
        size === "md" && "h-11 px-5",
        size === "lg" && "h-[62px] px-6 text-[17px]",
        size === "icon" && "size-11",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
});
