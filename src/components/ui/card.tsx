import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-[28px] bg-surface p-5", className)} {...props} />;
}

/** Tarjeta destacada del diseño: lima, degradado o tinta con trama. */
export function HeroCard({ tone = "lime", className, ...props }: HTMLAttributes<HTMLDivElement> & { tone?: "lime" | "grad" | "dark" }) {
  return (
    <div
      className={cn("rounded-[30px] p-3.5",
        tone === "lime" && "bg-lime text-lime-ink",
        tone === "grad" && "grad-card",
        tone === "dark" && "card-dark",
        className)}
      {...props}
    />
  );
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-[17px] font-semibold">{children}</h2>
      {action}
    </div>
  );
}
