"use client";

import { animate, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/avatar";
import { Logo } from "@/components/ui/misc";

const TICKS: { k: string; v: string; up: boolean }[] = [
  { k: "GASTO", v: "11.2%", up: false }, { k: "AHORRO", v: "13.5%", up: true },
  { k: "INGRESOS", v: "8.1%", up: true }, { k: "COMIDA", v: "4.3%", up: false },
  { k: "BALANCE", v: "3.7%", up: true }, { k: "OCIO", v: "2.0%", up: false },
  { k: "SUSCRIP.", v: "0.0%", up: true }, { k: "HOGAR", v: "1.6%", up: false },
];

function Ticker({ reverse }: { reverse?: boolean }) {
  // El contenido se duplica para que el bucle (-50 %) sea continuo.
  const items = [...TICKS, ...TICKS];
  return (
    <div className="overflow-hidden bg-dk text-white py-2.5" aria-hidden>
      <div className={reverse ? "ticker-track ticker-rev" : "ticker-track"}>
        {items.map((t, i) => (
          <span key={i} className="num flex shrink-0 items-center gap-2 px-5 text-[11px] font-semibold tracking-wider">
            <span className="text-dk-muted">{t.k}</span>
            <span className={t.up ? "text-[#6fe3b4]" : "text-[#ff7a9c]"}>{t.up ? "▲" : "▼"} {t.v}</span>
            <span className="ml-3 text-dk-line">|</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Pantalla de carga "terminal de trading": cinta de indicadores, contador 0 → 100 % y reveal del logo.
 * `duration` en ms; mientras es null se muestra en 0 (así el HTML del servidor ya contiene el splash).
 */
export function BrandLoader({ duration, onDone, className = "" }: { duration: number | null; onDone?: () => void; className?: string }) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(0);
  const [done, setDone] = useState(false);
  const cb = useRef(onDone);
  cb.current = onDone;

  useEffect(() => {
    if (duration === null) return;
    let timer: ReturnType<typeof setTimeout>;
    const ctl = animate(0, 100, {
      duration: reduce ? 0.2 : duration / 1000,
      ease: [0.65, 0, 0.35, 1],
      onUpdate: (v) => setN(Math.round(v)),
      onComplete: () => { setDone(true); timer = setTimeout(() => cb.current?.(), reduce ? 250 : 950); },
    });
    return () => { ctl.stop(); clearTimeout(timer); };
  }, [duration, reduce]);

  return (
    <div role="status" aria-live="polite" aria-label="Cargando Centimo"
      className={`pt-safe-lg fixed inset-0 z-[100] flex flex-col bg-bg pb-[max(env(safe-area-inset-bottom),1rem)] print:hidden ${className}`}>
      <Ticker />

      <div className="relative flex flex-1 flex-col items-center justify-center px-8">
        {/* Contador */}
        <div className={`flex flex-col items-center transition-all duration-300 ${done ? "pointer-events-none scale-95 opacity-0" : "opacity-100"}`}>
          <Avatar n={14} priority className="mb-2 size-28" />
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted">Sincronizando mercado</p>
          <p className="num mt-3 flex items-baseline text-[clamp(4.5rem,24vw,9rem)] font-semibold leading-none tracking-tight">
            {String(n).padStart(2, "0")}<span className="ml-1 text-[0.35em] text-muted">%</span>
          </p>
          <div className="mt-6 h-[3px] w-[min(18rem,70vw)] overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-accent" style={{ width: `${n}%` }} />
          </div>
        </div>

        {/* Logo */}
        {done && (
          <div className="absolute inset-0 grid place-items-center">
            <div className="logo-reveal"><Logo className="[&_img]:h-16 sm:[&_img]:h-20" /></div>
          </div>
        )}
      </div>

      <Ticker reverse />
    </div>
  );
}
