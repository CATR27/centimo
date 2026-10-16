import { Logo, ThemeToggleIcon } from "@/components/ui/misc";
import { isDemo } from "@/lib/supabase/env";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative m-4 hidden flex-col justify-between overflow-hidden rounded-[40px] bg-panel p-10 lg:flex">
        <Logo />
        <div>
          <p className="max-w-md text-6xl font-semibold leading-[1.02] tracking-tight">Tu dinero,<br />bajo control.</p>
          <p className="mt-5 max-w-sm text-ink/60">Registra, programa y analiza cada gasto con una vista clara y rápida.</p>
          <div className="mt-10 grid max-w-md grid-cols-2 gap-3">
            <div className="rounded-[28px] bg-surface p-4 shadow-sm">
              <p className="text-sm font-semibold">Balance</p>
              <p className="num mt-6 text-2xl font-semibold">$3,2 M</p>
              <p className="num text-xs font-semibold text-pos">▲ 13.5%</p>
            </div>
            <div className="grad-card flex flex-col justify-between rounded-[28px] p-4">
              <p className="muted-ink text-xs font-medium">Ahorro del mes</p>
              <p className="num text-4xl font-semibold">59%</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-ink/50">© Centimo</p>
      </aside>

      <main className="pt-safe relative flex min-h-dvh flex-col px-5 pb-8">
        <div className="flex items-center justify-between py-4 lg:justify-end">
          <Logo className="lg:hidden" />
          <ThemeToggleIcon />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-6">
          {isDemo && (
            <div className="mb-5 flex items-center gap-2 rounded-full bg-lime px-4 py-2.5 text-xs font-medium text-lime-ink">
              <span className="pulse-dot size-1.5 rounded-full bg-black" />
              Modo demo: cualquier dato te deja entrar. Los datos viven en este navegador.
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
