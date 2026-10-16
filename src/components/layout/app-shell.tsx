"use client";

import { BarChart3, CalendarClock, LayoutDashboard, ListOrdered, Plus, Settings, Tags } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "@/components/ui/misc";
import { QuickAddProvider, useQuickAdd } from "@/components/transactions/quick-add";
import { demoSignedIn } from "@/lib/auth";
import { StoreProvider, useStore } from "@/lib/store";
import { isDemo } from "@/lib/supabase/env";
import { cn } from "@/lib/utils";

const LEFT = [
  { href: "/dashboard", label: "Panel", Icon: LayoutDashboard },
  { href: "/transacciones", label: "Historial", Icon: ListOrdered },
];
const RIGHT = [
  { href: "/proximos", label: "Próximos", Icon: CalendarClock },
  { href: "/analisis", label: "Análisis", Icon: BarChart3 },
];
const SIDE = [...LEFT, ...RIGHT, { href: "/categorias", label: "Categorías", Icon: Tags }, { href: "/ajustes", label: "Ajustes", Icon: Settings }];

/** En modo demo la sesión vive en localStorage, así que el guard es de cliente. */
function useDemoGate() {
  const router = useRouter();
  const [ok, setOk] = useState(!isDemo);
  useEffect(() => {
    if (!isDemo) return;
    if (demoSignedIn()) setOk(true); else router.replace("/login");
  }, [router]);
  return ok;
}

export function AppShell({ children }: { children: ReactNode }) {
  const ok = useDemoGate();
  if (!ok) return <div className="min-h-dvh" />;
  return (
    <StoreProvider>
      <QuickAddProvider>
        <Frame>{children}</Frame>
      </QuickAddProvider>
    </StoreProvider>
  );
}

function Frame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { settings, demo } = useStore();
  const open = useQuickAdd();
  const active = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="min-h-dvh lg:pl-64">
      {/* Sidebar escritorio */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-line bg-surface/60 p-5 backdrop-blur lg:flex">
        <Logo className="mb-8" />
        <nav className="flex flex-1 flex-col gap-1" aria-label="Principal">
          {SIDE.map(({ href, label, Icon }) => (
            <Link key={href} href={href}
              className={cn("flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition",
                active(href) ? "bg-accent/12 text-accent" : "text-muted hover:bg-surface-2 hover:text-ink")}>
              <Icon className="size-5" /> {label}
            </Link>
          ))}
        </nav>
        <button onClick={() => open()} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-accent font-semibold text-accent-ink shadow-[var(--glow)]">
          <Plus className="size-5" /> Nuevo movimiento
        </button>
      </aside>

      {/* Cabecera móvil */}
      <header className="pt-safe sticky top-0 z-30 border-b border-line/70 bg-bg/80 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Logo />
          <div className="flex items-center gap-2">
            {demo && <span className="num rounded-md border border-amber/40 bg-amber/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-amber">DEMO</span>}
            <Link href="/ajustes" aria-label="Ajustes"
              className="grid size-10 place-items-center rounded-full border border-line bg-surface-2 text-sm font-semibold text-accent">
              {(settings.displayName || "?").slice(0, 1).toUpperCase()}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-4 lg:max-w-5xl lg:px-8 lg:pb-12 lg:pt-8">
        {children}
      </main>

      {/* Navegación inferior móvil */}
      <nav aria-label="Principal"
        className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/90 backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-2xl grid-cols-5 items-end px-2 pt-1.5">
          {LEFT.map((n) => <NavItem key={n.href} {...n} on={active(n.href)} />)}
          <div className="grid place-items-center">
            <button onClick={() => open()} aria-label="Nuevo movimiento"
              className="-mt-6 grid size-14 place-items-center rounded-2xl bg-accent text-accent-ink shadow-[var(--glow)] ring-4 ring-bg transition active:scale-95">
              <Plus className="size-7" strokeWidth={2.5} />
            </button>
          </div>
          {RIGHT.map((n) => <NavItem key={n.href} {...n} on={active(n.href)} />)}
        </div>
      </nav>
    </div>
  );
}

function NavItem({ href, label, Icon, on }: { href: string; label: string; Icon: typeof Plus; on: boolean }) {
  return (
    <Link href={href} aria-current={on ? "page" : undefined}
      className={cn("flex h-14 flex-col items-center justify-center gap-0.5 text-[10.5px] font-medium transition", on ? "text-accent" : "text-muted")}>
      <Icon className={cn("size-[22px]", on && "drop-shadow-[0_0_6px_var(--accent)]")} />
      {label}
    </Link>
  );
}
