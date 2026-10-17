"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatedIcon, type IconName } from "@/components/animated-icon";
import { Avatar } from "@/components/avatar";
import { NAV_GROUPS } from "@/components/layout/nav-config";
import { useQuickAdd } from "@/components/transactions/quick-add";
import { PrivacyToggle, ThemeToggleIcon } from "@/components/ui/misc";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const useActive = () => {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(href + "/");
};
const initial = (name: string) => (name || "?").slice(0, 1).toUpperCase();

/* ───────── Dock inferior (móvil): píldora oscura, "+" lima al centro ───────── */
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
    <nav aria-label="Principal" className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[max(env(safe-area-inset-bottom),1.375rem)] print:hidden lg:hidden">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-dk p-[7px] shadow-[0_18px_36px_-12px_rgb(10_30_25/0.5)]">
        {slots.map((n, idx) => n ? (
          <DockItem key={n.href} item={n} on={isActive(n.href)} />
        ) : (
          <button key={`fab${idx}`} onClick={() => open()} aria-label="Nuevo movimiento"
            className="grid size-[58px] place-items-center rounded-full bg-lime text-lime-ink transition active:scale-95">
            <AnimatedIcon name="nuevo" strokeWidth={2.4} className="size-[26px]" />
          </button>
        ))}
      </div>
    </nav>
  );
}

function DockItem({ item, on }: { item: { href: string; label: string; icon: IconName }; on: boolean }) {
  return (
    <Link href={item.href} aria-label={item.label} aria-current={on ? "page" : undefined}
      className={cn("relative grid size-[52px] place-items-center rounded-full transition-colors", on ? "text-lime" : "text-dk-muted active:text-dk-text")}>
      {on && (
        <motion.span layoutId="dock-active" transition={{ type: "spring", stiffness: 500, damping: 36 }}
          className="absolute inset-0 rounded-full bg-dk-3" />
      )}
      <AnimatedIcon name={item.icon} active={on} className="relative size-[22px]" />
    </Link>
  );
}

/* ───────── Riel lateral (escritorio): oscuro y flotante, 80 px → 256 px al pasar el cursor ───────── */
const SHOW = "opacity-0 transition-opacity duration-150 group-hover/rail:opacity-100 group-focus-within/rail:opacity-100";

export function Rail() {
  const open = useQuickAdd();
  const isActive = useActive();
  const { settings } = useStore();
  return (
    <aside
      aria-label="Menú principal"
      className="group/rail fixed bottom-4 left-4 top-4 z-40 hidden w-[80px] flex-col overflow-hidden rounded-[32px] bg-dk py-4 text-white transition-[width,box-shadow] duration-200 ease-out hover:w-[256px] hover:shadow-[24px_0_48px_-24px_rgb(10_30_25/0.45)] focus-within:w-[256px] focus-within:shadow-[24px_0_48px_-24px_rgb(10_30_25/0.45)] print:!hidden lg:flex"
    >
      <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden px-4 no-scrollbar">
        <Link href="/dashboard" aria-label="Inicio" className="relative mb-3 mt-0.5 block h-11 shrink-0">
          <Image src="/brand/icon.png" alt="Centimo" width={44} height={44} priority
            className="absolute left-0.5 top-0 size-11 rounded-[28%] transition-opacity duration-150 group-hover/rail:opacity-0 group-focus-within/rail:opacity-0" />
          <Image src="/brand/logo-dark.png" alt="" width={749} height={200} priority
            className={cn("absolute left-0.5 top-0.5 h-10 w-auto max-w-none", SHOW)} />
        </Link>

        <button onClick={() => open()} aria-label="Nuevo movimiento"
          className="mb-1 flex h-12 w-full shrink-0 items-center overflow-hidden rounded-full bg-lime text-lime-ink hover:brightness-95">
          <span className="grid size-12 shrink-0 place-items-center group-hover/rail:size-10 group-hover/rail:mx-[0] group-hover/rail:rounded-full group-hover/rail:bg-dk group-hover/rail:text-lime group-focus-within/rail:size-10 group-focus-within/rail:bg-dk group-focus-within/rail:text-lime">
            <AnimatedIcon name="nuevo" strokeWidth={2.4} className="size-[22px] group-hover/rail:size-[19px]" />
          </span>
          <span className={cn("whitespace-nowrap pl-2.5 pr-4 text-[15px] font-semibold", SHOW)}>Nuevo movimiento</span>
        </button>

        {NAV_GROUPS.map((g) => (
          <div key={g.title} className="flex flex-col gap-0.5">
            <div className="relative my-2.5 h-3.5 shrink-0">
              <span aria-hidden className="absolute left-1/2 top-1/2 h-px w-[22px] -translate-x-1/2 bg-dk-line transition-opacity group-hover/rail:opacity-0 group-focus-within/rail:opacity-0" />
              <span className={cn("absolute left-3.5 top-0 whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.16em] text-dk-muted", SHOW)}>
                {g.title}
              </span>
            </div>
            {g.items.map((n) => {
              const on = isActive(n.href);
              return (
                <Link key={n.href} href={n.href} aria-label={n.label} aria-current={on ? "page" : undefined}
                  className={cn("relative flex h-[46px] w-full shrink-0 items-center overflow-hidden rounded-full transition-colors",
                    on ? "text-dk group-hover/rail:bg-white group-focus-within/rail:bg-white" : "text-dk-text hover:bg-dk-2 hover:text-white")}>
                  <span className={cn("grid shrink-0 place-items-center rounded-full transition-all",
                    on ? "size-[46px] bg-lime group-hover/rail:size-[38px] group-focus-within/rail:size-[38px]" : "size-[46px]",
                    on ? "ml-0 group-hover/rail:ml-1 group-focus-within/rail:ml-1" : "")}>
                    <AnimatedIcon name={n.icon} active={on} className={on ? "size-[22px] group-hover/rail:size-5" : "size-[22px] group-hover/rail:size-5"} />
                  </span>
                  <span className={cn("flex-1 whitespace-nowrap pl-2.5 text-[15px]", on ? "font-semibold" : "font-medium", SHOW)}>{n.label}</span>
                  {on && <span aria-hidden className={cn("mr-3.5 size-[7px] rounded-full bg-dk", SHOW)} />}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Pie: recogido = herramientas circulares; desplegado = tarjeta de importar + usuario */}
      <div className="mt-2 px-4 pt-2">
        <div className="flex flex-col items-center gap-1.5 group-hover/rail:hidden group-focus-within/rail:hidden">
          <PrivacyToggle dark className="size-11" />
          <span title={settings.displayName} className="grid size-11 place-items-center rounded-full bg-lime text-[17px] font-bold text-lime-ink">{initial(settings.displayName)}</span>
        </div>
        <div className="hidden w-[224px] flex-col gap-2 group-hover/rail:flex group-focus-within/rail:flex">
          <Link href="/importar" className="grid grid-cols-[minmax(0,1fr)_64px] items-center gap-2.5 rounded-[26px] bg-lime p-2 text-lime-ink">
            <span className="flex flex-col py-1 pl-2 leading-tight">
              <span className="text-sm font-semibold">Importa tu extracto</span>
              <span className="text-xs text-lime-ink/60">CSV o PDF del banco</span>
            </span>
            <Avatar n={17} className="size-16" />
          </Link>
          <div className="flex items-center gap-2 rounded-full bg-dk-2 p-1.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-lime text-base font-bold text-lime-ink">{initial(settings.displayName)}</span>
            <span className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="truncate text-sm font-semibold">{settings.displayName || "Cuenta"}</span>
              <span className="text-xs text-dk-muted">Moneda {settings.currency}</span>
            </span>
            <PrivacyToggle dark className="size-9" />
            <ThemeToggleIcon dark className="size-9" />
          </div>
        </div>
      </div>
    </aside>
  );
}
