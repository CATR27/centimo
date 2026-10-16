"use client";

import { useId } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { formatCompact, formatMoney } from "@/lib/money";
import type { CategorySlice, SeriesPoint } from "@/lib/analytics";

const AXIS = { fontSize: 10, fill: "var(--muted)" } as const;

function Tip({ active, payload, label, currency }: {
  active?: boolean; payload?: { name?: string; value?: number; color?: string; payload?: Record<string, unknown> }[]; label?: string; currency: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="num rounded-lg border border-line bg-surface/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <div className="mb-1 text-muted">{label ?? (payload[0].payload?.name as string)}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          <span className="font-semibold">{formatMoney(Number(p.value), currency)}</span>
        </div>
      ))}
    </div>
  );
}

/** Área de gasto con degradado y brillo neón. */
export function SpendArea({ data, currency, color = "var(--neg)", height = 220, cumulative = false, compare }: {
  data: SeriesPoint[]; currency: string; color?: string; height?: number; cumulative?: boolean; compare?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const key = cumulative ? "cumulative" : "expense";
  return (
    <div style={{ height }} className="-mx-1 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`g${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: color }} stopOpacity={0.45} />
              <stop offset="100%" style={{ stopColor: color }} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="2 6" />
          <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} minTickGap={24} interval="preserveStartEnd" />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} width={44} tickFormatter={(v) => formatCompact(v, currency)} />
          <Tooltip content={<Tip currency={currency} />} cursor={{ stroke: color, strokeOpacity: 0.5, strokeDasharray: "3 3" }} />
          {compare && <Area dataKey="income" type="monotone" stroke="var(--pos)" strokeWidth={1.5} fill="none" dot={false} />}
          <Area dataKey={key} type="monotone" stroke="none" fill={`url(#g${uid})`} dot={false} activeDot={false} isAnimationActive={false} tooltipType="none" />
          <Area
            dataKey={key} type="monotone" stroke={color} strokeWidth={2.4} fill="none"
            dot={false} activeDot={{ r: 5, stroke: "var(--bg)", strokeWidth: 2 }}
            isAnimationActive animationDuration={700}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Donut por categoría con segmentos neón. */
export function CategoryDonut({ data, currency, centerLabel, centerValue, size = 190 }: {
  data: CategorySlice[]; currency: string; centerLabel: string; centerValue: string; size?: number;
}) {
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <PieChart>
          <Pie
            data={data} dataKey="value" nameKey="name" innerRadius="68%" outerRadius="94%"
            paddingAngle={data.length > 1 ? 3 : 0} cornerRadius={5} stroke="none" startAngle={90} endAngle={-270}
            isAnimationActive animationDuration={700}
          >
            {data.map((d) => <Cell key={d.id} fill={d.color} />)}
          </Pie>
          <Tooltip content={<Tip currency={currency} />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted">{centerLabel}</div>
          <div className="num text-lg font-semibold">{centerValue}</div>
        </div>
      </div>
    </div>
  );
}

export function WeekdayBars({ data, currency, color = "var(--cyan)" }: {
  data: { label: string; avg: number }[]; currency: string; color?: string;
}) {
  const max = Math.max(...data.map((d) => d.avg));
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
          <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} />
          <Tooltip content={<Tip currency={currency} />} cursor={{ fill: "var(--surface-2)" }} />
          <Bar dataKey="avg" radius={[6, 6, 2, 2]} isAnimationActive animationDuration={600}>
            {data.map((d) => (
              <Cell key={d.label} fill={color} fillOpacity={d.avg === max ? 1 : 0.4} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Sparkline({ values, color, height = 36 }: { values: number[]; color: string; height?: number }) {
  const uid = useId().replace(/:/g, "");
  const data = values.map((v, i) => ({ i, v }));
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart data={data} margin={{ top: 3, right: 0, left: 0, bottom: 3 }}>
          <defs>
            <linearGradient id={`s${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: color }} stopOpacity={0.35} /><stop offset="100%" style={{ stopColor: color }} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area dataKey="v" type="monotone" stroke={color} strokeWidth={1.8} fill={`url(#s${uid})`} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Barra de presupuesto: se calienta (ámbar → magenta) al acercarse al límite. */
export function BudgetBar({ ratio, color }: { ratio: number; color: string }) {
  const over = ratio > 1;
  const c = over ? "var(--neg)" : ratio > 0.85 ? "var(--amber)" : color;
  return (
    <div className="h-2 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={Math.round(ratio * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full transition-[width] duration-700"
        style={{ width: `${Math.min(ratio, 1) * 100}%`, background: c }} />
    </div>
  );
}
