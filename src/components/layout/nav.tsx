"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatedIcon, type IconName } from "@/components/animated-icon";
import { NAV_GROUPS } from "@/components/layout/nav-config";
import { useQuickAdd } from "@/components/transactions/quick-add";
import { Logo, PrivacyToggle, ThemeToggleIcon } from "@/components/ui/misc";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const useActive = () => {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(href + "/");
};
const initial = (name: string) => (name || "?").slice(0, 1).toUpperCase();

/* ───────── Barra superior (móvil) ───────── */
export function TopBar() {
  const { settings, demo } = useStore();
  const isActive = useActive();
  return (
    <header className="pt-safe sticky top-0 z-30 bg-panel/90 backdrop-blur-xl print:hidden lg:hidden">
      <div className="mx-auto flex h-16 max-w-2xl items-center gap-2 px-4">
        <Link href="/dashboard" aria-label="Inicio" className="mr-auto"><Logo /></Link>
        {demo && <span className="rounded-full bg-lime px-3 py-1.5 text-[10px] font-bold tracking-wider text-lime-ink">DEMO</span>}
        <PrivacyToggle />
        <ThemeToggleIcon />
        <Link href="/ajustes" aria-label="Ajustes" aria-current={isActive("/ajustes") ? "page" : undefined}
          className={cn("grid size-11 place-items-center rounded-full text-sm font-bold transition",
            isActive("/ajustes") ? "bg-accent text-accent-ink" : "bg-surface text-ink shadow-sm")}>
          {initial(settings.displayName)}
        </Link>
      </div>
    </header>
  );
}

/* ───────── Dock inferior (móvil): 5 casillas idénticas, "+" al centro ───────── */
const DOCK: { href: string; label: string; icon: IconName }[] = [
  { href: "/dashboard", label: "Panel", icon: "panel" },
  { href: "/transacciones", label: "Historial", icon: "historial" },
  { href: "/proximos", label: "Próximos", icon: "proximos" },
  { href: "/hub", label: "Hub", icon: "hub" },
];

export function Dock() {
  const open = useQuickAdd();
  const isActive = useActive();
  const slots = [DOCK[0], DOCK[1], null, DOCK[2], DOCK[3]];
  return (
    <nav aria-label="Principal" className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] print:hidden lg:hidden">
      <div className="dock pointer-events-auto mx-auto grid max-w-md grid-cols-5 place-items-center rounded-full bg-surface p-2">
        {slots.map((n, idx) => n ? (
          <DockItem key={n.href} item={n} on={isActive(n.href)} />
        ) : (
          <button key={`fab${idx}`} onClick={() => open()} aria-label="Nuevo movimiento"
            className="grid size-14 place-items-center rounded-full bg-lime text-lime-ink transition active:scale-95">
            <AnimatedIcon name="nuevo" className="size-7" />
          </button>
        ))}
      </div>
    </nav>
  );
}

function DockItem({ item, on }: { item: { href: string; label: string; icon: IconName }; on: boolean }) {
  return (
    <Link href={item.href} aria-label={item.label} aria-current={on ? "page" : undefined}
      className={cn("relative grid size-14 place-items-center rounded-full transition-colors", on ? "text-accent-ink" : "text-muted active:text-ink")}>
      {on && (
        <motion.span layoutId="dock-active" transition={{ type: "spring", stiffness: 500, damping: 36 }}
          className="absolute inset-0 rounded-full bg-accent" />
      )}
      <AnimatedIcon name={item.icon} active={on} className="relative size-6" />
    </Link>
  );
}

/* ───────── Riel lateral (escritorio): se despliega al pasar el cursor ───────── */
const RAIL_ITEM = "relative flex h-[46px] w-full shrink-0 items-center overflow-hidden rounded-full transition-colors [@media(max-height:840px)]:h-10";
const LABEL = "whitespace-nowrap pr-4 text-sm font-semibold opacity-0 transition-opacity duration-150 group-hover/rail:opacity-100 group-focus-within/rail:opacity-100";

export function Rail() {
  const open = useQuickAdd();
  const isActive = useActive();
  const { settings } = useStore();
  return (
    <aside
      aria-label="Menú principal"
      className="group/rail fixed inset-y-0 left-0 z-40 hidden w-[80px] print:!hidden flex-col overflow-hidden bg-panel py-5 transition-[width,box-shadow] duration-200 ease-out hover:w-[256px] hover:shadow-[24px_0_48px_-24px_rgb(10_30_25/0.35)] focus-within:w-[256px] focus-within:shadow-[24px_0_48px_-24px_rgb(10_30_25/0.35)] lg:flex"
    >
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden px-[17px] no-scrollbar">
        <Link href="/dashboard" aria-label="Inicio" className={cn(RAIL_ITEM, "mb-3 h-12 overflow-visible")}>
          <span className="grid h-full w-[46px] shrink-0 place-items-center transition-opacity duration-150 group-hover/rail:opacity-0 group-focus-within/rail:opacity-0">
            <Logo iconOnly className="size-10" />
          </span>
          <span className="absolute left-0 top-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-150 group-hover/rail:opacity-100 group-focus-within/rail:opacity-100">
            <Logo className="[&_img]:h-10" />
          </span>
        </Link>

        <button onClick={() => open()} aria-label="Nuevo movimiento"
          className={cn(RAIL_ITEM, "mb-2 bg-lime text-lime-ink hover:brightness-95")}>
          <span className="grid h-full w-[46px] shrink-0 place-items-center"><AnimatedIcon name="nuevo" className="size-6" /></span>
          <span className={LABEL}>Nuevo movimiento</span>
        </button>

        {NAV_GROUPS.map((g) => (
          <div key={g.title} className="flex shrink-0 flex-col gap-1">
            <div className="relative my-1.5 h-4 shrink-0">
              <span aria-hidden className="absolute left-1/2 top-1/2 h-px w-6 -translate-x-1/2 bg-ink/15 transition-opacity group-hover/rail:opacity-0 group-focus-within/rail:opacity-0" />
              <span className="absolute left-3 top-0 whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.14em] text-ink/45 opacity-0 transition-opacity group-hover/rail:opacity-100 group-focus-within/rail:opacity-100">
                {g.title}
              </span>
            </div>
            {g.items.map((n) => {
              const on = isActive(n.href);
              return (
                <Link key={n.href} href={n.href} aria-label={n.label} aria-current={on ? "page" : undefined}
                  className={cn(RAIL_ITEM, on ? "text-accent-ink" : "text-ink/70 hover:bg-white/50 hover:text-ink")}>
                  {on && (
                    <motion.span layoutId="rail-active" transition={{ type: "spring", stiffness: 500, damping: 38 }}
                      className="absolute inset-0 rounded-full bg-accent" />
                  )}
                  <span className="relative grid h-full w-[46px] shrink-0 place-items-center">
                    <AnimatedIcon name={n.icon} active={on} className="size-6" />
                  </span>
                  <span className={cn("relative", LABEL)}>{n.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Pie: herramientas y usuario, con la misma rejilla */}
      <div className="mt-2 flex flex-col gap-1 px-[17px] pt-2">
        <span aria-hidden className="mx-auto mb-1 h-px w-6 bg-ink/15" />
        <div className="flex items-center gap-1 overflow-hidden rounded-full">
          <span className="grid h-full w-[46px] shrink-0 place-items-center"><PrivacyToggle className="size-[42px]" /></span>
          <span className="opacity-0 transition-opacity group-hover/rail:opacity-100 group-focus-within/rail:opacity-100"><ThemeToggleIcon /></span>
        </div>
        <div className={cn(RAIL_ITEM, "h-[52px]")} title={settings.displayName}>
          <span className="grid h-full w-[46px] shrink-0 place-items-center">
            <span className="grid size-10 place-items-center rounded-full bg-surface text-sm font-bold shadow-sm">{initial(settings.displayName)}</span>
          </span>
          <span className={cn("min-w-0 flex-1 truncate text-left", LABEL)}>{settings.displayName || "Cuenta"}</span>
        </div>
      </div>
    </aside>
  );
}
