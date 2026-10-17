"use client";

import { AnimatedIcon } from "@/components/animated-icon";
import { Avatar } from "@/components/avatar";

/** Pantalla de bienvenida móvil (diseño 3b): lima, ilustración geométrica animada y dos acciones. */
export function Welcome({ onEnter, onCreate }: { onEnter: () => void; onCreate: () => void }) {
  return (
    <div className="fixed inset-0 z-30 flex flex-col overflow-hidden bg-lime text-lime-ink lg:hidden">
      <div className="relative flex-1 pt-[env(safe-area-inset-top)]">
        {/* Ilustración */}
        <span className="deco-float absolute left-6 top-[calc(env(safe-area-inset-top)+22px)] grid size-[46px] place-items-center rounded-full border-[1.8px] border-lime-ink">
          <AnimatedIcon name="cuentas" strokeWidth={1.8} className="size-6" />
        </span>
        <span className="deco-float absolute left-[156px] top-[calc(env(safe-area-inset-top)+14px)] -rotate-[8deg]" style={{ "--d": "-2s" } as React.CSSProperties}>
          <AnimatedIcon name="reporte" strokeWidth={1.6} className="size-12" />
        </span>
        <Avatar n={1} priority className="absolute right-2 top-[calc(env(safe-area-inset-top)+2px)] size-28" />

        <div className="absolute left-1/2 top-[calc(env(safe-area-inset-top)+92px)] size-[270px] -translate-x-1/2 rounded-full bg-[#cdee86]" />
        <div className="absolute left-1/2 top-[calc(env(safe-area-inset-top)+116px)] size-[222px] -translate-x-1/2">
          <div className="deco-spin absolute inset-0 rounded-full border-[40px] border-lime-ink" style={{ borderRightColor: "transparent", rotate: "10deg" }} />
          <div className="absolute bottom-[72px] left-[66px] flex items-end gap-[9px]">
            {[36, 56, 78].map((h, i) => (
              <span key={h} className="deco-bar w-[22px] rounded-[7px] bg-lime-ink" style={{ height: h, "--d": `${i * 0.35}s` } as React.CSSProperties} />
            ))}
          </div>
        </div>

        <span className="deco-float absolute left-[22px] top-[calc(env(safe-area-inset-top)+300px)] flex -rotate-[7deg] items-center gap-2 whitespace-nowrap rounded-full bg-white py-2 pl-2 pr-3.5 text-sm font-semibold">
          <span className="grid size-7 place-items-center rounded-full bg-lime-ink text-[11px] text-lime">▲</span>Ahorro 13.5%
        </span>
        <span className="deco-float num absolute right-5 top-[calc(env(safe-area-inset-top)+240px)] flex rotate-[6deg] items-center gap-2 whitespace-nowrap rounded-full bg-lime-ink px-3.5 py-2 text-sm font-semibold text-white" style={{ "--d": "-3s" } as React.CSSProperties}>
          −$ 45.500
        </span>

        {/* Titular */}
        <div className="absolute inset-x-6 bottom-[104px] flex flex-col gap-3.5">
          <h2 className="text-[50px] font-semibold leading-none tracking-[-0.01em]">
            Tu dinero,<br />
            <span className="inline-flex items-center gap-3">bajo
              <span className="inline-grid h-[42px] w-[82px] place-items-center rounded-full bg-lime-ink text-lime">
                <AnimatedIcon name="adelante" strokeWidth={2.2} className="size-[26px]" />
              </span>
            </span><br />control.
          </h2>
          <p className="text-base leading-[1.4] text-lime-ink/60">Registra gastos, programa pagos y entiende tus finanzas.</p>
        </div>

        <div className="absolute inset-x-6 bottom-[calc(max(env(safe-area-inset-bottom),0px)+22px)] flex items-center justify-between">
          <button onClick={onCreate} className="text-base font-semibold active:opacity-60">Crear cuenta</button>
          <button onClick={onEnter} className="flex items-center gap-3 text-base font-semibold active:opacity-80">
            Entrar
            <span className="grid size-[58px] place-items-center rounded-full bg-lime-ink text-white transition active:scale-95">
              <AnimatedIcon name="enviar" strokeWidth={2} className="size-6" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
