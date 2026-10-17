"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * Iconos propios del diseño v4 (trazos y geometría idénticos al mock) con micro-movimiento:
 *  - reposo: respiración muy leve + un gesto propio por icono (solo transform/opacity);
 *  - activo / hover: la animación "de entrada" más marcada (.ai-play), y luego vuelve al reposo.
 */
export type IconName =
  | "panel" | "historial" | "proximos" | "analisis" | "categorias" | "ajustes" | "nuevo"
  | "hub" | "calendario" | "suscripciones" | "reporte" | "cuentas" | "privado" | "importar"
  | "buscar" | "filtro" | "banco" | "cash" | "tarjeta" | "salud" | "ocio" | "compras" | "educacion"
  | "utensils" | "home" | "wallet" | "car" | "wifi"
  | "atras" | "adelante" | "enviar" | "gasto" | "ingreso" | "check" | "luna" | "sol" | "mail" | "candado"
  | "clip" | "izquierda" | "derecha" | "alerta" | "x" | "mas" | "menos" | "mas-grande" | "tag";

/* Helpers idénticos a los del diseño (R = rect redondeado, C = círculo) */
const R = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 -${r} ${r}h-${w - 2 * r}a${r} ${r} 0 0 1 -${r} -${r}v-${h - 2 * r}a${r} ${r} 0 0 1 ${r} -${r}z`;
const C = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 -${2 * r} 0`;

/** Trazados completos (para usar fuera de la animación, p. ej. en SVG estáticos). */
export const ICON_PATHS: Record<string, string> = {
  panel: R(3.5, 3.5, 7, 7, 2) + R(13.5, 3.5, 7, 7, 2) + R(3.5, 13.5, 7, 7, 2) + R(13.5, 13.5, 7, 7, 2),
  historial: "M9 6.5h11M9 12h11M9 17.5h11" + C(4.5, 6.5, 0.45) + C(4.5, 12, 0.45) + C(4.5, 17.5, 0.45),
  proximos: R(3.5, 5, 17, 15.5, 3) + "M3.5 10h17M8 3v4M16 3v4M8.5 15.2l2.4 2.3 4.6-4.7",
  calendario: R(3.5, 5, 17, 15.5, 3) + "M3.5 10h17M8 3v4M16 3v4" + C(8.5, 14, 0.45) + C(12, 14, 0.45) + C(15.5, 14, 0.45) + C(8.5, 17.4, 0.45),
  hub: [6, 12, 18].flatMap((y) => [6, 12, 18].map((x) => C(x, y, 0.8))).join(""),
  analisis: "M3.5 20.5h17" + R(5.5, 12, 3.2, 6.5, 1) + R(10.4, 6, 3.2, 12.5, 1) + R(15.3, 9.5, 3.2, 9, 1),
  suscripciones: "M20 12a8 8 0 0 1-14.2 5M4 12a8 8 0 0 1 14.2-5M18.5 3.5V8H14M5.5 20.5V16H10",
  reporte: "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 16.5h6",
  cuentas: R(3.5, 6.5, 17, 13, 3.2) + "M3.5 10.5h17" + C(16.5, 15, 0.45),
  categorias: "M3.8 12.4V5.6a1.8 1.8 0 0 1 1.8-1.8h6.8a1.8 1.8 0 0 1 1.3.5l7 7a1.8 1.8 0 0 1 0 2.5l-6.8 6.8a1.8 1.8 0 0 1-2.5 0l-7-7a1.8 1.8 0 0 1-.6-1.2z" + C(8.2, 8.2, 0.5),
  importar: "M4 15v4a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19v-4M12 3.5v11M7.5 10.5L12 15l4.5-4.5",
  ajustes: "M4 7h8.8M17.2 7H20M4 12h2.3M10.7 12H20M4 17h9.8M18.2 17H20" + C(15, 7, 2.2) + C(8.5, 12, 2.2) + C(16, 17, 2.2),
  privado: "M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12z" + C(12, 12, 2.8),
  nuevo: "M12 5v14M5 12h14",
  buscar: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.5-3.5",
  filtro: "M4 6h16M7 12h10M10 18h4",
  salud: "M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z",
  ocio: "M6 3h12l4 6-10 13L2 9ZM2 9h20M12 22 8 9l4-6 4 6-4 13",
  compras: "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4ZM3 6h18M16 10a4 4 0 0 1-8 0",
  educacion: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20",
  banco: "M3 21h18M5 21V10M10 21V10M14 21V10M19 21V10M2 10l10-7 10 7Z",
  cash: "M3 6h18v12H3zM7 6v12M17 6v12" + C(12, 12, 2.2),
  tarjeta: "M3 6.5h18v11H3zM3 10.5h18M7 14.5h3",
  utensils: "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7",
  home: "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  wallet: "M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4",
  car: "M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" + C(7, 17, 2) + "M9 17h6" + C(17, 17, 2),
  wifi: "M2 9.5a15 15 0 0 1 20 0M5 13a10 10 0 0 1 14 0M8.5 16.4a5 5 0 0 1 7 0" + C(12, 20, 0.5),
  atras: "m12 19-7-7 7-7M19 12H5",
  adelante: "M5 12h14m-7-7 7 7-7 7",
  enviar: "M7 17 17 7M7 7h10v10",
  gasto: "M12 5v14m7-7-7 7-7-7",
  ingreso: "M12 19V5m-7 7 7-7 7 7",
  check: "M20 6 9 17l-5-5",
  luna: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z",
  sol: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  mail: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 7l-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7",
  candado: R(3, 11, 18, 11, 2) + "M7 11V7a5 5 0 0 1 10 0v4",
  clip: "m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48",
  izquierda: "m15 18-6-6 6-6",
  derecha: "m9 18 6-6-6-6",
  alerta: "M12 8v5M12 17h.01" + C(12, 12, 9.5),
  x: "M18 6 6 18M6 6l12 12",
  mas: "M12 5v14M5 12h14",
  menos: "M5 12h14",
  "mas-grande": "M12 5v14M5 12h14",
  tag: "M12.6 2.6a2 2 0 0 0-1.4-.6H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z" + C(7.5, 7.5, 0.5),
};

interface Props {
  name: IconName;
  /** Marca la pestaña activa: reproduce la animación marcada al activarse. */
  active?: boolean;
  /** Movimiento en reposo (respiración + gesto). Desactívalo en listas largas. */
  idle?: boolean;
  strokeWidth?: number;
  className?: string;
}

/** Icono con micro-animación: reposo sutil, y animación marcada al activarse o al tocar/pasar el cursor. */
export function AnimatedIcon({ name, active = false, idle = true, strokeWidth = 1.8, className }: Props) {
  const [tick, setTick] = useState(0);
  const [playing, setPlaying] = useState(false);
  const first = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const play = () => {
    setTick((t) => t + 1);
    setPlaying(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setPlaying(false), 950);
  };

  useEffect(() => {
    if (first.current) { first.current = false; if (!active) return; }
    if (active) play();
  }, [active]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <span className={cn("inline-block", className)} onPointerEnter={play}>
      <svg
        key={tick} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}
        strokeLinecap="round" strokeLinejoin="round"
        className={cn("size-full overflow-visible", idle && !playing && "ic-idle", playing && "ai-play")} aria-hidden
      >
        <Glyph name={name} />
      </svg>
    </span>
  );
}

const i = (n: number, extra?: CSSProperties) => ({ style: { "--i": n, ...extra } as CSSProperties });
const dx = (n: number, v: string) => ({ "--dx": v, "--i": n }) as CSSProperties;

function Glyph({ name }: { name: IconName }) {
  switch (name) {
    case "panel":
      return (<>
        <rect className="ai-pop id-pulse" {...i(0)} x="3.5" y="3.5" width="7" height="7" rx="2" />
        <rect className="ai-pop id-pulse" {...i(1)} x="13.5" y="3.5" width="7" height="7" rx="2" />
        <rect className="ai-pop id-pulse" {...i(3)} x="3.5" y="13.5" width="7" height="7" rx="2" />
        <rect className="ai-pop id-pulse" {...i(2)} x="13.5" y="13.5" width="7" height="7" rx="2" />
      </>);
    case "historial":
      return (<>
        <path className="ai-draw" {...i(0)} d="M9 6.5h11" />
        <path className="ai-draw" {...i(1)} d="M9 12h11" />
        <path className="ai-draw" {...i(2)} d="M9 17.5h11" />
        <circle className="ai-pop id-pulse" {...i(0)} cx="4.5" cy="6.5" r="0.45" />
        <circle className="ai-pop id-pulse" {...i(1)} cx="4.5" cy="12" r="0.45" />
        <circle className="ai-pop id-pulse" {...i(2)} cx="4.5" cy="17.5" r="0.45" />
      </>);
    case "proximos":
      return (<>
        <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
        <path d="M3.5 10h17M8 3v4M16 3v4" />
        <path className="ai-draw id-dash" {...i(1)} d="M8.5 15.2l2.4 2.3 4.6-4.7" />
      </>);
    case "calendario":
      return (<>
        <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
        <path d="M3.5 10h17M8 3v4M16 3v4" />
        <circle className="ai-pop id-pulse" {...i(0)} cx="8.5" cy="14" r="0.45" />
        <circle className="ai-pop id-pulse" {...i(1)} cx="12" cy="14" r="0.45" />
        <circle className="ai-pop id-pulse" {...i(2)} cx="15.5" cy="14" r="0.45" />
        <circle className="ai-pop id-pulse" {...i(3)} cx="8.5" cy="17.4" r="0.45" />
      </>);
    case "hub":
      return (<>
        {[6, 12, 18].flatMap((y, r) => [6, 12, 18].map((x, c) => (
          <circle key={`${x}${y}`} className="ai-pop id-pulse" {...i(r + c)} cx={x} cy={y} r="0.8" />
        )))}
      </>);
    case "analisis":
      return (<>
        <path d="M3.5 20.5h17" />
        <rect className="ai-grow id-bars" {...i(0)} x="5.5" y="12" width="3.2" height="6.5" rx="1" />
        <rect className="ai-grow id-bars" {...i(1)} x="10.4" y="6" width="3.2" height="12.5" rx="1" />
        <rect className="ai-grow id-bars" {...i(2)} x="15.3" y="9.5" width="3.2" height="9" rx="1" />
      </>);
    case "suscripciones":
      return (
        <g className="ai-spin id-rock">
          <path d="M20 12a8 8 0 0 1-14.2 5M4 12a8 8 0 0 1 14.2-5" />
          <path d="M18.5 3.5V8H14M5.5 20.5V16H10" />
        </g>
      );
    case "reporte":
      return (<>
        <path d="M7 3h7l5 5v13H7zM14 3v5h5" />
        <path className="ai-draw id-dash" {...i(0)} d="M10 13h6" />
        <path className="ai-draw id-dash" {...i(1)} d="M10 16.5h6" />
      </>);
    case "cuentas":
      return (<>
        <rect x="3.5" y="6.5" width="17" height="13" rx="3.2" />
        <path d="M3.5 10.5h17" />
        <circle className="ai-slide id-slide" style={dx(0, "-1.4px")} cx="16.5" cy="15" r="0.45" />
      </>);
    case "categorias":
      return (
        <g className="ai-swing id-sway">
          <path d="M3.8 12.4V5.6a1.8 1.8 0 0 1 1.8-1.8h6.8a1.8 1.8 0 0 1 1.3.5l7 7a1.8 1.8 0 0 1 0 2.5l-6.8 6.8a1.8 1.8 0 0 1-2.5 0l-7-7a1.8 1.8 0 0 1-.6-1.2z" />
          <circle cx="8.2" cy="8.2" r="0.5" />
        </g>
      );
    case "importar":
      return (<>
        <path d="M4 15v4a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19v-4" />
        <g className="ai-slide id-bob">
          <path d="M12 3.5v11M7.5 10.5L12 15l4.5-4.5" />
        </g>
      </>);
    case "ajustes":
      return (<>
        <path d="M4 7h8.8M17.2 7H20M4 12h2.3M10.7 12H20M4 17h9.8M18.2 17H20" />
        <circle className="ai-slide id-slide" style={dx(0, "1.3px")} cx="15" cy="7" r="2.2" />
        <circle className="ai-slide id-slide" style={dx(1, "-1.3px")} cx="8.5" cy="12" r="2.2" />
        <circle className="ai-slide id-slide" style={dx(2, "1.3px")} cx="16" cy="17" r="2.2" />
      </>);
    case "privado":
      return (<>
        <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12z" />
        <circle className="ai-pop id-gaze" {...i(0)} cx="12" cy="12" r="2.8" />
      </>);
    case "nuevo":
    case "mas":
    case "mas-grande":
      return (<g className="ai-spin"><path d="M12 5v14M5 12h14" /></g>);
    case "buscar":
      return (<g className="id-drift"><circle cx="11" cy="11" r="7" /><path className="ai-draw" d="M20 20l-3.5-3.5" /></g>);
    case "filtro":
      return (<>
        <path className="ai-draw id-dash" {...i(0)} d="M4 6h16" />
        <path className="ai-draw id-dash" {...i(1)} d="M7 12h10" />
        <path className="ai-draw id-dash" {...i(2)} d="M10 18h4" />
      </>);
    case "cash":
      return (<>
        <path d="M3 6h18v12H3zM7 6v12M17 6v12" />
        <circle className="ai-pop id-pulse" cx="12" cy="12" r="2.2" />
      </>);
    case "tarjeta":
      return (<>
        <path d="M3 6.5h18v11H3zM3 10.5h18" />
        <path className="ai-draw id-dash" d="M7 14.5h3" />
      </>);
    case "wifi":
      return (<>
        <path className="ai-draw id-dash" {...i(2)} d="M2 9.5a15 15 0 0 1 20 0" />
        <path className="ai-draw id-dash" {...i(1)} d="M5 13a10 10 0 0 1 14 0" />
        <path className="ai-draw id-dash" {...i(0)} d="M8.5 16.4a5 5 0 0 1 7 0" />
        <circle className="ai-pop id-pulse" cx="12" cy="20" r="0.5" />
      </>);
    case "car":
      return (<g className="id-bob"><path d={ICON_PATHS.car} /></g>);
    case "check":
      return (<path className="ai-draw" d={ICON_PATHS.check} />);
    case "enviar":
      return (<g className="id-drift"><path d="M7 17 17 7" /><path d="M7 7h10v10" /></g>);
    case "adelante":
      return (<g className="ai-slide id-slide" style={dx(0, "1.4px")}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></g>);
    case "atras":
      return (<g className="ai-slide id-slide" style={dx(0, "-1.4px")}><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></g>);
    case "gasto":
      return (<g className="id-bob"><path d="M12 5v14" /><path d="m19 12-7 7-7-7" /></g>);
    case "ingreso":
      return (<g className="id-bob" style={{ animationDirection: "reverse" }}><path d="M12 19V5" /><path d="m5 12 7-7 7 7" /></g>);
    case "luna":
      return (<g className="id-sway"><path d={ICON_PATHS.luna} /></g>);
    case "sol":
      return (<g className="id-rock"><path d={ICON_PATHS.sol} /></g>);
    case "clip":
      return (<g className="id-rock"><path d={ICON_PATHS.clip} /></g>);
    case "alerta":
      return (<><circle cx="12" cy="12" r="9.5" /><path className="id-pulse" d="M12 8v5M12 17h.01" /></>);
    default:
      return <path d={ICON_PATHS[name]} />;
  }
}
