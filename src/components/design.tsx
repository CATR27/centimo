"use client";

import type { ReactNode } from "react";
import { Avatar } from "@/components/avatar";
import { cn } from "@/lib/utils";

/** Barra de puntos del diseño (presupuesto / ahorro): `on` puntos encendidos de `total`. */
export function DotBar({ on, total = 10, color = "var(--text)", track = "#d6e0de", className, padded = true }: {
  on: number; total?: number; color?: string; track?: string; className?: string; padded?: boolean;
}) {
  return (
    <span className={cn("flex gap-[3px] rounded-full", padded && "p-1", className)} aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className="h-2 flex-1 rounded-full transition-colors" style={{ background: i < on ? color : track }} />
      ))}
    </span>
  );
}

/** Reduce una serie a como máximo `max` puntos (promedio por tramo). */
export function downsample(values: number[], max = 36) {
  if (values.length <= max) return values;
  const size = values.length / max;
  return Array.from({ length: max }, (_, i) => {
    const a = Math.floor(i * size), b = Math.max(a + 1, Math.floor((i + 1) * size));
    const sl = values.slice(a, b);
    return sl.reduce((s, v) => s + v, 0) / sl.length;
  });
}

/** Línea suave con área — trazo lima sobre tarjeta oscura (curva de control a mitad de tramo, como en el diseño). */
export function LineArea({ values, color = "#d9f26a", height = 62, className }: { values: number[]; color?: string; height?: number; className?: string }) {
  const W = 300, H = 70;
  const v = downsample(values.length > 1 ? values : [0, 0]);
  const mn = Math.min(...v), mx = Math.max(...v);
  const pts = v.map((y, i) => [(i * W) / (v.length - 1), H - 6 - ((y - mn) / (mx - mn || 1)) * (H - 14)]);
  let line = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], cx = (x0 + x1) / 2;
    line += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height }} className={cn("block w-full", className)} aria-hidden>
      <path d={`${line} L${W},${H} L0,${H} Z`} fill={color} fillOpacity=".14" />
      <path d={line} fill="none" stroke={color} strokeWidth="2.4" vectorEffect="non-scaling-stroke" strokeLinecap="round" className="line-draw" />
    </svg>
  );
}

/** Dona del diseño: segmentos con trazo de 24 sobre r=60, separados por 3 px. */
export function Donut({ slices, size = 150, children }: { slices: { id: string; color: string; value: number }[]; size?: number; children?: ReactNode }) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const CIRC = 2 * Math.PI * 60;
  let acc = 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 160 160" className="block size-full" aria-hidden>
        <circle cx="80" cy="80" r="60" fill="none" stroke="var(--surface-2)" strokeWidth="24" />
        {slices.map((s, i) => {
          const len = (CIRC * s.value) / total;
          const el = (
            <circle key={s.id} cx="80" cy="80" r="60" fill="none" stroke={s.color} strokeWidth="24"
              strokeDasharray={`${Math.max(len - (slices.length > 1 ? 3 : 0), 1).toFixed(1)} ${CIRC.toFixed(1)}`}
              strokeDashoffset={(-acc).toFixed(1)} transform="rotate(-90 80 80)" className="donut-seg" style={{ animationDelay: `${i * 70}ms` }} />
          );
          acc += len;
          return el;
        })}
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center leading-tight">{children}</span>
    </div>
  );
}

/** Círculo con icono (acceso rápido / botón de cabecera). */
export function Circle({ className, children }: { className?: string; children: ReactNode }) {
  return <span className={cn("grid place-items-center rounded-full", className)}>{children}</span>;
}

/** Etiqueta pequeña en mayúsculas del diseño (ej. "GASTO · 30D"). */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("text-[13px] font-semibold uppercase tracking-[0.14em]", className)}>{children}</span>;
}

/** Tarjeta destacada con texto a la izquierda y personaje animado a la derecha (112 px). */
export function HeroBanner({ tone = "lime", avatar, children, className }: {
  tone?: "lime" | "grad" | "dark" | "white"; avatar: number; children: ReactNode; className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-[minmax(0,1fr)_112px] items-center gap-3 rounded-[30px] p-3.5",
      tone === "lime" && "bg-lime text-lime-ink", tone === "grad" && "grad-card", tone === "dark" && "card-dark", tone === "white" && "bg-surface",
      className)}>
      <div className="flex min-w-0 flex-col gap-1 py-1 pl-1.5">{children}</div>
      <Avatar n={avatar} className="size-28" />
    </div>
  );
}
