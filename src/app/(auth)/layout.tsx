import { Logo, ThemeToggleIcon } from "@/components/ui/misc";
import { isDemo } from "@/lib/supabase/env";

const TICKS = [
  { k: "COMIDA", v: "-12.4%", up: false }, { k: "AHORRO", v: "+8.1%", up: true },
  { k: "OCIO", v: "+3.0%", up: false }, { k: "NÓMINA", v: "+0.0%", up: true },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid min-h-dvh overflow-hidden lg:grid-cols-2">
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_75%)]" />
      <div className="animate-drift pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-accent/20 blur-[90px]" />
      <div className="animate-drift pointer-events-none absolute -bottom-32 -right-20 size-96 rounded-full bg-[#ff2e97]/15 blur-[100px] [animation-delay:-6s]" />

      <aside className="relative hidden flex-col justify-between p-12 lg:flex">
        <Logo />
        <div>
          <p className="num text-6xl font-semibold leading-[1.05] tracking-tight">
            Tu dinero,<br /><span className="text-accent glow-text">en tiempo real.</span>
          </p>
          <p className="mt-5 max-w-sm text-muted">Registra, programa y analiza cada gasto con la claridad de una terminal de trading.</p>
          <div className="mt-10 flex gap-3">
            {TICKS.map((t) => (
              <div key={t.k} className="rounded-xl border border-line bg-surface/60 px-3 py-2 backdrop-blur">
                <div className="text-[10px] tracking-widest text-muted">{t.k}</div>
                <div className={`num text-sm font-medium ${t.up ? "text-pos" : "text-neg"}`}>{t.v}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted">© Centimo</p>
      </aside>

      <main className="pt-safe relative flex min-h-dvh flex-col px-5 pb-8 lg:justify-center">
        <div className="flex items-center justify-between py-4 lg:absolute lg:inset-x-8 lg:top-4 lg:justify-end">
          <Logo className="lg:hidden" />
          <ThemeToggleIcon />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-6 lg:flex-none">
          {isDemo && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-amber/40 bg-amber/10 px-3 py-2 text-xs text-amber">
              <span className="pulse-dot size-1.5 rounded-full bg-amber" />
              Modo demo: cualquier dato te deja entrar. Los datos viven en este navegador.
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
