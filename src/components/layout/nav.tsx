"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatedIcon, type IconName } from "@/components/animated-icon";
import { useQuickAdd } from "@/components/transactions/quick-add";
import { Logo, ThemeToggleIcon } from "@/components/ui/misc";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface Item { href: string; label: string; icon: IconName }
const MAIN: Item[] = [
  { href: "/dashboard", label: "Panel", icon: "panel" },
  { href: "/transacciones", label: "Historial", icon: "historial" },
  { href: "/proximos", label: "Próximos", icon: "proximos" },
  { href: "/analisis", label: "Análisis", icon: "analisis" },
];
const EXTRA: Item[] = [
  { href: "/categorias", label: "Categorías", icon: "categorias" },
  { href: "/ajustes", label: "Ajustes", icon: "ajustes" },
];

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
    <header className="pt-safe sticky top-0 z-30 bg-panel/90 backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex h-16 max-w-2xl items-center gap-2 px-4">
        <Link href="/dashboard" aria-label="Inicio"><Logo /></Link>
        <div className="ml-auto flex items-center gap-2">
          {demo && <span className="rounded-full bg-lime px-3 py-1.5 text-[10px] font-bold tracking-wider text-lime-ink">DEMO</span>}
          <ThemeToggleIcon />
          <Link href="/ajustes" aria-label="Ajustes" aria-current={isActive("/ajustes") ? "page" : undefined}
            className={cn("grid size-11 place-items-center rounded-full text-sm font-bold transition",
              isActive("/ajustes") ? "bg-accent text-accent-ink" : "bg-surface text-ink shadow-sm")}>
            {initial(settings.displayName)}
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ───────── Dock inferior (móvil): píldora blanca, círculo negro activo ───────── */
export function Dock() {
  const open = useQuickAdd();
  const isActive = useActive();
  const left = MAIN.slice(0, 2);
  const right = MAIN.slice(2);
  return (
    <nav aria-label="Principal" className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] lg:hidden">
      <div className="dock pointer-events-auto mx-auto flex max-w-md items-center justify-between rounded-full bg-surface p-2">
        {left.map((n) => <DockItem key={n.href} item={n} on={isActive(n.href)} />)}
        <button
          onClick={() => open()} aria-label="Nuevo movimiento"
          className="grid size-14 shrink-0 place-items-center rounded-full bg-lime text-lime-ink transition active:scale-95"
        >
          <AnimatedIcon name="nuevo" className="size-7" />
        </button>
        {right.map((n) => <DockItem key={n.href} item={n} on={isActive(n.href)} />)}
      </div>
    </nav>
  );
}

function DockItem({ item, on }: { item: Item; on: boolean }) {
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

/* ───────── Riel lateral (escritorio) ───────── */
export function Rail() {
  const open = useQuickAdd();
  const isActive = useActive();
  const { settings } = useStore();
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-[104px] flex-col items-center bg-panel py-7 lg:flex">
      <Link href="/dashboard" aria-label="Inicio" className="mb-10 grid size-12 place-items-center">
        <Logo iconOnly />
      </Link>
      <nav className="flex flex-1 flex-col items-center gap-3" aria-label="Principal">
        {[...MAIN, ...EXTRA.slice(0, 1)].map((n) => <RailItem key={n.href} item={n} on={isActive(n.href)} />)}
        <button onClick={() => open()} aria-label="Nuevo movimiento" title="Nuevo movimiento"
          className="mt-3 grid size-14 place-items-center rounded-full bg-lime text-lime-ink transition hover:scale-105 active:scale-95">
          <AnimatedIcon name="nuevo" className="size-6" />
        </button>
      </nav>
      <div className="flex flex-col items-center gap-3">
        <ThemeToggleIcon />
        <RailItem item={EXTRA[1]} on={isActive(EXTRA[1].href)} />
        <span aria-hidden title={settings.displayName} className="grid size-10 place-items-center rounded-full bg-surface text-sm font-bold shadow-sm">
          {initial(settings.displayName)}
        </span>
      </div>
    </aside>
  );
}

function RailItem({ item, on }: { item: Item; on: boolean }) {
  return (
    <Link href={item.href} aria-label={item.label} title={item.label} aria-current={on ? "page" : undefined}
      className={cn("relative grid size-14 place-items-center rounded-full transition-colors", on ? "text-accent-ink" : "text-ink/70 hover:text-ink")}>
      {on && (
        <motion.span layoutId="rail-active" transition={{ type: "spring", stiffness: 500, damping: 38 }}
          className="absolute inset-0 rounded-full bg-accent" />
      )}
      <AnimatedIcon name={item.icon} active={on} className="relative size-6" />
    </Link>
  );
}
