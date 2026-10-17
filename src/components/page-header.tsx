"use client";

import { useRouter } from "next/navigation";
import { AnimatedIcon } from "@/components/animated-icon";
import { cn } from "@/lib/utils";

/** Cabecera del diseño: botón atrás circular + título + acción circular. */
export function PageHeader({ title, sub, right, back = true }: { title: string; sub?: string; right?: React.ReactNode; back?: boolean }) {
  const router = useRouter();
  return (
    <div className="mb-4 flex items-center gap-3 lg:mb-6">
      {back && (
        <button onClick={() => router.back()} aria-label="Volver"
          className="grid size-12 shrink-0 place-items-center rounded-full bg-surface transition active:scale-95 lg:hidden">
          <AnimatedIcon name="atras" strokeWidth={2} className="size-[22px]" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[28px] font-semibold leading-none lg:text-[40px]">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

/** Botón circular blanco de 48 px para la derecha de la cabecera. */
export function RoundAction({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={cn("grid size-12 shrink-0 place-items-center rounded-full bg-surface transition active:scale-95", className)} {...props}>
      {children}
    </button>
  );
}
