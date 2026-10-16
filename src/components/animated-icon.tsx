"use client";

import type { AnimationItem } from "lottie-web";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type IconName =
  | "panel" | "historial" | "proximos" | "analisis" | "categorias" | "ajustes" | "nuevo"
  | "hub" | "calendario" | "suscripciones" | "reporte" | "cuentas" | "privado";

/**
 * Nombres de archivos disponibles en /public/animated-icons (p. ej. panel.json).
 * Si existe `<nombre>.json` (Lottie exportado de animatedicons.co) se usa en lugar del SVG nativo.
 */
const LottieCtx = createContext<string[]>([]);
export const LottieIconsProvider = ({ names, children }: { names: string[]; children: ReactNode }) => (
  <LottieCtx.Provider value={names}>{children}</LottieCtx.Provider>
);

const cache = new Map<string, Promise<object | null>>();
const loadLottie = (name: string) => {
  if (!cache.has(name)) cache.set(name, fetch(`/animated-icons/${name}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null));
  return cache.get(name)!;
};

interface Props { name: IconName; active?: boolean; className?: string }

/** Icono con micro-animación: se reproduce al activarse y al tocar/pasar el cursor. */
export function AnimatedIcon({ name, active = false, className }: Props) {
  const lottieNames = useContext(LottieCtx);
  const hasLottie = lottieNames.includes(name);
  const [tick, setTick] = useState(0);
  const [lottieOk, setLottieOk] = useState(false);
  const box = useRef<HTMLSpanElement>(null);
  const anim = useRef<AnimationItem | null>(null);
  const first = useRef(true);

  useEffect(() => {
    if (!hasLottie) return;
    let dead = false;
    Promise.all([loadLottie(name), import("lottie-web/build/player/lottie_light")]).then(([data, mod]) => {
      if (dead || !data || !box.current) return;
      anim.current = mod.default.loadAnimation({
        container: box.current, renderer: "svg", loop: false, autoplay: false, animationData: structuredClone(data),
      });
      setLottieOk(true);
    });
    return () => { dead = true; anim.current?.destroy(); anim.current = null; setLottieOk(false); };
  }, [hasLottie, name]);

  useEffect(() => {
    if (first.current) { first.current = false; if (!active) return; }
    if (active) setTick((t) => t + 1);
  }, [active]);
  useEffect(() => { if (tick) anim.current?.goToAndPlay(0, true); }, [tick]);

  const replay = () => setTick((t) => t + 1);

  if (hasLottie) {
    return (
      <span className={cn("inline-block", className)} onPointerEnter={replay}>
        <span ref={box} className={cn("block size-full", !lottieOk && "hidden")} />
        {!lottieOk && <FallbackSvg name={name} tick={tick} />}
      </span>
    );
  }
  return (
    <span className={cn("inline-block", className)} onPointerEnter={replay}>
      <FallbackSvg name={name} tick={tick} />
    </span>
  );
}

function FallbackSvg({ name, tick }: { name: IconName; tick: number }) {
  return (
    <svg
      key={tick} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round" className={cn("size-full overflow-visible", tick > 0 && "ai-play")} aria-hidden
    >
      <Glyph name={name} />
    </svg>
  );
}

const i = (n: number) => ({ style: { "--i": n } as React.CSSProperties });

function Glyph({ name }: { name: IconName }) {
  switch (name) {
    case "panel":
      return (<>
        <rect className="ai-pop" {...i(0)} x="3.5" y="3.5" width="7" height="7" rx="2" />
        <rect className="ai-pop" {...i(1)} x="13.5" y="3.5" width="7" height="7" rx="2" />
        <rect className="ai-pop" {...i(3)} x="3.5" y="13.5" width="7" height="7" rx="2" />
        <rect className="ai-pop" {...i(2)} x="13.5" y="13.5" width="7" height="7" rx="2" />
      </>);
    case "historial":
      return (<>
        <path className="ai-draw" {...i(0)} d="M9 6.5h11" />
        <path className="ai-draw" {...i(1)} d="M9 12h11" />
        <path className="ai-draw" {...i(2)} d="M9 17.5h11" />
        <circle className="ai-pop" {...i(0)} cx="4.5" cy="6.5" r="1.1" fill="currentColor" />
        <circle className="ai-pop" {...i(1)} cx="4.5" cy="12" r="1.1" fill="currentColor" />
        <circle className="ai-pop" {...i(2)} cx="4.5" cy="17.5" r="1.1" fill="currentColor" />
      </>);
    case "proximos":
      return (<>
        <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
        <path d="M3.5 10h17M8 3v4M16 3v4" />
        <path className="ai-draw" {...i(1)} d="M8.5 15.2l2.4 2.3 4.6-4.7" />
      </>);
    case "analisis":
      return (<>
        <path d="M3.5 20.5h17" />
        <rect className="ai-grow" {...i(0)} x="5.5" y="12" width="3.2" height="6.5" rx="1" />
        <rect className="ai-grow" {...i(1)} x="10.4" y="6" width="3.2" height="12.5" rx="1" />
        <rect className="ai-grow" {...i(2)} x="15.3" y="9.5" width="3.2" height="9" rx="1" />
      </>);
    case "categorias":
      return (
        <g className="ai-swing">
          <path d="M3.8 12.4V5.6a1.8 1.8 0 0 1 1.8-1.8h6.8a1.8 1.8 0 0 1 1.3.5l7 7a1.8 1.8 0 0 1 0 2.5l-6.8 6.8a1.8 1.8 0 0 1-2.5 0l-7-7a1.8 1.8 0 0 1-.6-1.2z" />
          <circle cx="8.2" cy="8.2" r="1.3" fill="currentColor" />
        </g>
      );
    case "ajustes":
      return (<>
        <path d="M4 7h16M4 12h16M4 17h16" />
        <circle className="ai-slide" {...i(0)} style={{ "--dx": "-7px" } as React.CSSProperties} cx="15" cy="7" r="2.2" fill="var(--surface)" />
        <circle className="ai-slide" {...i(1)} style={{ "--dx": "7px" } as React.CSSProperties} cx="8.5" cy="12" r="2.2" fill="var(--surface)" />
        <circle className="ai-slide" {...i(2)} style={{ "--dx": "-6px" } as React.CSSProperties} cx="16" cy="17" r="2.2" fill="var(--surface)" />
      </>);
    case "hub":
      return (<>
        {[6, 12, 18].flatMap((y, r) => [6, 12, 18].map((x, c) => (
          <circle key={`${x}${y}`} className="ai-pop" {...i(r + c)} cx={x} cy={y} r="1.7" fill="currentColor" stroke="none" />
        )))}
      </>);
    case "calendario":
      return (<>
        <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
        <path d="M3.5 10h17M8 3v4M16 3v4" />
        <circle className="ai-pop" {...i(0)} cx="8.5" cy="14" r="1.1" fill="currentColor" stroke="none" />
        <circle className="ai-pop" {...i(1)} cx="12" cy="14" r="1.1" fill="currentColor" stroke="none" />
        <circle className="ai-pop" {...i(2)} cx="15.5" cy="14" r="1.1" fill="currentColor" stroke="none" />
        <circle className="ai-pop" {...i(3)} cx="8.5" cy="17.4" r="1.1" fill="currentColor" stroke="none" />
      </>);
    case "suscripciones":
      return (
        <g className="ai-spin">
          <path d="M20 12a8 8 0 0 1-14.2 5M4 12a8 8 0 0 1 14.2-5" />
          <path d="M18.5 3.5V8H14M5.5 20.5V16H10" />
        </g>
      );
    case "reporte":
      return (<>
        <path d="M7 3h7l5 5v13H7z" />
        <path d="M14 3v5h5" />
        <path className="ai-draw" {...i(0)} d="M10 13h6" />
        <path className="ai-draw" {...i(1)} d="M10 16.5h6" />
      </>);
    case "cuentas":
      return (<>
        <rect x="3.5" y="6.5" width="17" height="13" rx="3.2" />
        <path d="M3.5 10.5h17" />
        <circle className="ai-slide" {...i(0)} style={{ "--dx": "-6px" } as React.CSSProperties} cx="16.5" cy="15" r="1.3" fill="currentColor" stroke="none" />
      </>);
    case "privado":
      return (<>
        <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12z" />
        <circle className="ai-pop" {...i(0)} cx="12" cy="12" r="2.8" />
      </>);
    case "nuevo":
      return (<g className="ai-spin" strokeWidth={2.4}><path d="M12 5v14M5 12h14" /></g>);
  }
}
