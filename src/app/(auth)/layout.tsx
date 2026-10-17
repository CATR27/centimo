import { AnimatedIcon, type IconName } from "@/components/animated-icon";
import { Avatar } from "@/components/avatar";
import { ThemeToggleIcon } from "@/components/ui/misc";
import { isDemo } from "@/lib/supabase/env";
import { cn } from "@/lib/utils";

const STEPS: { n: string; title: string; avatar: number; icon: IconName; value: string; sub: string; tone: "light" | "dark" }[] = [
  { n: "01", title: "Registra", avatar: 4, icon: "nuevo", value: "−$ 45.500", sub: "Domicilio · hoy", tone: "light" },
  { n: "02", title: "Programa", avatar: 13, icon: "proximos", value: "−$ 1.150.000", sub: "Arriendo · 6 días", tone: "dark" },
  { n: "03", title: "Entiende", avatar: 10, icon: "analisis", value: "Hogar 48%", sub: "del gasto de abril", tone: "light" },
];

/** Panel de marca de escritorio (diseño 3b): degradado, titular grande y los 3 pasos con personajes. */
function Showcase() {
  return (
    <aside
      className="relative m-4 hidden flex-col gap-7 overflow-hidden rounded-[40px] px-10 pb-10 pt-9 lg:flex"
      style={{ background: "linear-gradient(180deg,#f0fd80 0%,#cdee86 42%,#5fb99b 100%)", color: "#0a0d0c" }}
    >
      <div className="flex items-center justify-between">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo-light.png" alt="Centimo" className="h-10 w-auto" />
        <span className="deco-float flex h-10 items-center gap-2 whitespace-nowrap rounded-full bg-white/70 pl-1.5 pr-4 text-sm font-semibold">
          <span className="grid size-7 place-items-center rounded-full bg-[#0a0d0c] text-[11px] text-[#eefc7a]">▲</span>Ahorro 13.5% este mes
        </span>
      </div>

      <div className="flex flex-col gap-3.5">
        <h2 className="text-[clamp(52px,5.6vw,78px)] font-semibold leading-[.96] tracking-[-0.01em]">
          Tu dinero,<br />
          <span className="inline-flex items-center gap-[18px]">bajo
            <span className="inline-grid h-[clamp(44px,4.8vw,62px)] w-[clamp(88px,9.6vw,124px)] shrink-0 place-items-center rounded-full bg-[#0a0d0c] text-[#eefc7a]">
              <AnimatedIcon name="adelante" strokeWidth={2.2} className="size-[34px]" />
            </span>
          </span><br />control.
        </h2>
        <p className="max-w-[440px] text-lg leading-[1.4] text-[#0a0d0c]/60">Registra gastos, programa pagos y entiende tus finanzas con una vista clara y rápida.</p>
      </div>

      <div className="mt-auto flex items-center gap-3 text-[13px] font-bold uppercase tracking-[0.16em] text-[#0a0d0c]/60">
        Así funciona<span className="h-0 flex-1 border-t-2 border-dashed border-[#0a0d0c]/30" />3 pasos
      </div>
      <div className="mt-1.5 grid grid-cols-3 items-end gap-3.5">
        {STEPS.map((s, i) => (
          <div key={s.n} className={cn("flex flex-col gap-2 rounded-[30px] bg-white p-3.5", i === 1 && "-translate-y-7 shadow-[0_24px_40px_-24px_rgb(10_30_25/0.45)]")}>
            <div className="flex items-center gap-2">
              <span className="num grid size-[34px] shrink-0 place-items-center rounded-full bg-[#0a0d0c] text-[13px] font-bold text-[#eefc7a]">{s.n}</span>
              <span className="text-[19px] font-semibold">{s.title}</span>
            </div>
            <span className="grid aspect-square place-items-center rounded-[22px] bg-[#eef2f1]"><Avatar n={s.avatar} className="size-[94%]" /></span>
            <span className={cn("flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-2.5", s.tone === "dark" ? "bg-[#0a0d0c] text-white" : "bg-[#eef2f1] text-[#0a0d0c]")}>
              <span className="grid size-[30px] shrink-0 place-items-center rounded-full bg-[#eefc7a] text-[#0a0d0c]"><AnimatedIcon name={s.icon} strokeWidth={1.9} className="size-[15px]" /></span>
              <span className="flex min-w-0 flex-col leading-[1.15]">
                <span className="num whitespace-nowrap text-[13px] font-semibold">{s.value}</span>
                <span className="whitespace-nowrap text-[11px] opacity-60">{s.sub}</span>
              </span>
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg lg:grid lg:grid-cols-[1.05fr_1fr]">
      <Showcase />
      <main className="relative flex min-h-dvh flex-col lg:min-h-0 lg:items-center lg:justify-center lg:p-6">
        <div className="absolute right-7 top-7 hidden lg:block"><ThemeToggleIcon /></div>
        <div className="flex w-full flex-1 flex-col px-5 pb-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] lg:w-[410px] lg:flex-none lg:p-0">
          {isDemo && (
            <div className="mb-3 flex items-center gap-2 rounded-full bg-lime px-4 py-2.5 text-xs font-medium text-lime-ink">
              <span className="pulse-dot size-1.5 shrink-0 rounded-full bg-black" />
              Modo demo: cualquier dato te deja entrar.
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
