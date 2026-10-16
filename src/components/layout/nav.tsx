"use client";

import { motion } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { AnimatedIcon, type IconName } from "@/components/animated-icon";
import { useQuickAdd } from "@/components/transactions/quick-add";
import { Logo, ThemeToggleIcon } from "@/components/ui/misc";
import { delta, totals } from "@/lib/analytics";
import { periodRanges } from "@/lib/dates";
import { formatCompact } from "@/lib/money";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface Item { href: string; label: string; icon: IconName }
const LEFT: Item[] = [
  { href: "/dashboard", label: "Panel", icon: "panel" },
  { href: "/transacciones", label: "Historial", icon: "historial" },
];
const RIGHT: Item[] = [
  { href: "/proximos", label: "Próximos", icon: "proximos" },
  { href: "/analisis", label: "Análisis", icon: "analisis" },
];
const SIDE: Item[] = [
  ...LEFT, ...RIGHT,
  { href: "/categorias", label: "Categorías", icon: "categorias" },
  { href: "/ajustes", label: "Ajustes", icon: "ajustes" },
];

const useActive = () => {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(href + "/");
};

/* ───────── Barra superior (móvil) ───────── */
export function TopBar() {
  const { settings, demo } = useStore();
  const isActive = useActive();
  return (
    <header className="pt-safe sticky top-0 z-30 border-b border-line bg-surface/90 shadow-[0_8px_20px_-14px_rgb(0_0_0/0.5)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex h-14 max-w-2xl items-center gap-2 px-4">
        <Link href="/dashboard" aria-label="Inicio"><Logo /></Link>
        <div className="ml-auto flex items-center gap-2">
          {demo && <span className="num rounded-md bg-amber/15 px-2 py-1 text-[10px] font-bold tracking-wider text-amber">DEMO</span>}
          <span className="num hidden rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted min-[380px]:block">
            {format(new Date(), "EEE d MMM", { locale: es })}
          </span>
          <ThemeToggleIcon />
          <Link href="/ajustes" aria-label="Ajustes" aria-current={isActive("/ajustes") ? "page" : undefined}
            className={cn("grid size-11 place-items-center rounded-xl border bg-surface-2 text-sm font-bold text-accent transition",
              isActive("/ajustes") ? "border-accent" : "border-line")}>
            {(settings.displayName || "?").slice(0, 1).toUpperCase()}
          </Link>
        </div>
      </div>
      <Ticker />
    </header>
  );
}

/** Cinta de indicadores del mes, estilo terminal de mercado. */
function Ticker() {
  const { transactions, settings, ready } = useStore();
  const cur = settings.currency;
  const t = useMemo(() => {
    const { current, previous } = periodRanges("MES");
    const now = totals(transactions, current);
    const before = totals(transactions, previous);
    return { now, spendDelta: delta(now.expense, before.expense), incDelta: delta(now.income, before.income) };
  }, [transactions]);

  const cells = [
    { k: "GASTO", v: formatCompact(t.now.expense, cur), d: t.spendDelta, invert: true },
    { k: "INGRESOS", v: formatCompact(t.now.income, cur), d: t.incDelta, invert: false },
    { k: "BALANCE", v: formatCompact(t.now.net, cur), d: null, invert: false, tone: t.now.net >= 0 ? "text-pos" : "text-neg" },
  ];
  return (
    <div className="border-t border-line/70 bg-surface-2/60">
      <div className="mx-auto flex h-9 max-w-2xl items-center divide-x divide-line/80 overflow-x-auto px-1 no-scrollbar" aria-label="Indicadores del mes">
        <span className="num shrink-0 px-3 text-[10px] font-bold tracking-wider text-accent">MES</span>
        {cells.map((c) => (
          <div key={c.k} className="flex shrink-0 items-center gap-2 px-3">
            <span className="num text-[10px] font-semibold tracking-wider text-muted">{c.k}</span>
            <span className={cn("num text-xs font-semibold", c.tone, !ready && "opacity-40")}>{c.v}</span>
            {c.d !== null && (
              <span className={cn("num text-[10px] font-semibold", (c.invert ? c.d <= 0 : c.d >= 0) ? "text-pos" : "text-neg")}>
                {c.d >= 0 ? "▲" : "▼"}{Math.abs(c.d).toFixed(1)}%
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────── Dock inferior (móvil) ───────── */
export function Dock() {
  const open = useQuickAdd();
  const isActive = useActive();
  return (
    <nav aria-label="Principal" className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] lg:hidden">
      <div className="dock pointer-events-auto relative mx-auto max-w-md rounded-[28px] border border-line bg-surface p-1.5">
        {/* Remate superior: línea de acento sólida */}
        <span aria-hidden className="absolute inset-x-10 -top-px h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
        <div className="grid grid-cols-5 items-end gap-0.5">
          {LEFT.map((n) => <DockItem key={n.href} item={n} on={isActive(n.href)} />)}
          <div className="grid place-items-center">
            <button
              onClick={() => open()} aria-label="Nuevo movimiento"
              className="-mt-8 grid size-[58px] place-items-center rounded-[20px] border-[5px] border-bg bg-accent text-accent-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.4),inset_0_-3px_0_rgb(0_0_0/0.2),0_8px_14px_-4px_rgb(0_0_0/0.6)] transition active:translate-y-0.5 active:shadow-[inset_0_1px_0_rgb(255_255_255/0.3),0_3px_6px_-2px_rgb(0_0_0/0.6)]"
            >
              <AnimatedIcon name="nuevo" className="size-7" />
            </button>
          </div>
          {RIGHT.map((n) => <DockItem key={n.href} item={n} on={isActive(n.href)} />)}
        </div>
      </div>
    </nav>
  );
}

function DockItem({ item, on }: { item: Item; on: boolean }) {
  return (
    <Link href={item.href} aria-current={on ? "page" : undefined}
      className={cn("relative flex h-[58px] flex-col items-center justify-center gap-1 rounded-[20px] transition-colors", on ? "text-accent" : "text-muted active:text-ink")}>
      {on && (
        <motion.span layoutId="dock-active" transition={{ type: "spring", stiffness: 500, damping: 36 }}
          className="absolute inset-0 rounded-[20px] border border-line bg-surface-2 shadow-[inset_0_2px_5px_rgb(0_0_0/0.28)]">
          <span className="absolute left-1/2 top-0 h-[3px] w-6 -translate-x-1/2 rounded-b-full bg-accent" />
        </motion.span>
      )}
      <AnimatedIcon name={item.icon} active={on} className="relative size-6" />
      <span className="relative text-[10.5px] font-semibold leading-none tracking-wide">{item.label}</span>
    </Link>
  );
}

/* ───────── Barra lateral (escritorio) ───────── */
export function Sidebar() {
  const open = useQuickAdd();
  const isActive = useActive();
  const { settings } = useStore();
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-line bg-surface p-4 shadow-[12px_0_32px_-24px_rgb(0_0_0/0.6)] lg:flex">
      <div className="mb-6 flex items-center justify-between px-2 pt-1">
        <Logo />
        <ThemeToggleIcon />
      </div>
      <p className="num mb-2 px-3 text-[10px] font-semibold tracking-[0.18em] text-muted">NAVEGACIÓN</p>
      <nav className="flex flex-1 flex-col gap-1" aria-label="Principal">
        {SIDE.map((n) => {
          const on = isActive(n.href);
          return (
            <Link key={n.href} href={n.href} aria-current={on ? "page" : undefined}
              className={cn("relative flex h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors", on ? "text-accent" : "text-muted hover:text-ink")}>
              {on && (
                <motion.span layoutId="side-active" transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  className="absolute inset-0 rounded-xl border border-line bg-surface-2 shadow-[inset_0_2px_5px_rgb(0_0_0/0.25)]">
                  <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent" />
                </motion.span>
              )}
              <AnimatedIcon name={n.icon} active={on} className="relative size-[22px]" />
              <span className="relative">{n.label}</span>
            </Link>
          );
        })}
      </nav>
      <button onClick={() => open()}
        className="mb-3 flex h-12 items-center justify-center gap-2 rounded-xl bg-accent font-semibold text-accent-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.4),inset_0_-3px_0_rgb(0_0_0/0.2),0_6px_12px_-4px_rgb(0_0_0/0.5)] transition active:translate-y-0.5">
        <AnimatedIcon name="nuevo" className="size-5" /> Nuevo movimiento
      </button>
      <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-2 p-2.5">
        <span className="grid size-10 place-items-center rounded-lg bg-surface text-sm font-bold text-accent">
          {(settings.displayName || "?").slice(0, 1).toUpperCase()}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{settings.displayName || "Cuenta"}</span>
          <span className="num block text-[11px] text-muted">{settings.currency}</span>
        </span>
      </div>
    </aside>
  );
}
