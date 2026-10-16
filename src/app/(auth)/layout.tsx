import { Utensils, Home } from "lucide-react";
import { Sparkline } from "@/components/charts/charts";
import { Logo, ThemeToggleIcon } from "@/components/ui/misc";
import { isDemo } from "@/lib/supabase/env";

const SPARK = [18, 22, 19, 27, 24, 31, 28, 36, 33, 41, 38, 47];

/** Composición decorativa con los mismos componentes visuales del dashboard (no interactiva). */
function Showcase() {
  return (
    <div aria-hidden className="grid max-w-xl grid-cols-2 gap-3">
      <div className="rounded-[28px] bg-surface p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Balance</span>
          <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-semibold text-muted">30D</span>
        </div>
        <div className="mt-2"><Sparkline values={SPARK} color="var(--chart)" height={52} /></div>
        <p className="num mt-1 text-2xl font-semibold">$3,7 M</p>
        <p className="num text-xs font-semibold text-pos">▲ 13.5%</p>
      </div>
      <div className="grad-card flex flex-col justify-between rounded-[28px] p-5">
        <p className="muted-ink text-xs font-medium">Ahorro del mes</p>
        <p className="num text-5xl font-semibold tracking-tight">68%</p>
        <div className="border-t border-dashed border-black/25 pt-2">
          <p className="text-sm font-semibold">Vas muy bien</p>
          <p className="muted-ink text-xs">Gastas menos que el mes pasado</p>
        </div>
      </div>
      <div className="col-span-2 divide-y divide-line/60 rounded-[28px] bg-surface px-5 py-2 shadow-sm">
        {[
          { Icon: Utensils, name: "Domicilio", cat: "Comida", amount: "−$ 45.500", tone: "#ff6b35" },
          { Icon: Home, name: "Arriendo", cat: "Hogar", amount: "−$ 1.150.000", tone: "#4d7cff" },
        ].map(({ Icon, name, cat, amount, tone }) => (
          <div key={name} className="flex items-center gap-3 py-3">
            <span className="grid size-11 place-items-center rounded-full" style={{ background: `color-mix(in srgb, ${tone} 16%, transparent)`, color: tone }}>
              <Icon className="size-5" />
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block text-sm font-semibold">{name}</span>
              <span className="text-xs text-muted">{cat}</span>
            </span>
            <span className="num text-sm font-semibold">{amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* Panel de marca (escritorio) */}
      <aside className="relative m-4 hidden flex-col justify-between gap-10 overflow-hidden rounded-[40px] bg-panel p-10 xl:p-12 lg:flex">
        <Logo className="[&_img]:h-12" />
        <div className="space-y-8">
          <div>
            <h2 className="max-w-md text-5xl font-semibold leading-[1.04] tracking-tight xl:text-6xl">Tu dinero,<br />bajo control.</h2>
            <p className="mt-4 max-w-sm text-ink/60">Registra gastos, programa pagos y entiende tus finanzas con una vista clara y rápida.</p>
          </div>
          <Showcase />
        </div>
        <p className="text-xs text-ink/50">© {new Date().getFullYear()} Centimo</p>
      </aside>

      <main className="flex min-h-dvh flex-col bg-panel lg:relative lg:min-h-0 lg:bg-transparent">
        {/* Cabecera móvil */}
        <div className="pt-safe px-5 pb-8 pt-5 lg:hidden">
          <div className="flex items-center justify-between">
            <Logo className="[&_img]:h-10" />
            <ThemeToggleIcon />
          </div>
        </div>
        <div className="absolute right-6 top-5 hidden lg:block"><ThemeToggleIcon /></div>

        <div className="flex flex-1 flex-col rounded-t-[40px] bg-surface px-5 pb-10 pt-8 shadow-[0_-12px_32px_-20px_rgb(10_30_25/0.25)] lg:items-center lg:justify-center lg:rounded-none lg:bg-transparent lg:px-8 lg:py-10 lg:shadow-none">
          <div className="mx-auto w-full max-w-[26rem] lg:rounded-[40px] lg:border lg:border-line/70 lg:bg-surface lg:p-9 lg:shadow-[var(--shadow-card)]">
            {isDemo && (
              <div className="mb-5 flex items-center gap-2 rounded-full bg-lime px-4 py-2.5 text-xs font-medium text-lime-ink">
                <span className="pulse-dot size-1.5 shrink-0 rounded-full bg-black" />
                Modo demo: cualquier dato te deja entrar.
              </div>
            )}
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
