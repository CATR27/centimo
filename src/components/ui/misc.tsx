"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-surface-2", className)} />;
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
        <rect width="32" height="32" rx="9" className="fill-accent" />
        <path d="M7 21l5-6 4 3 8-9" fill="none" stroke="var(--accent-ink)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-lg">centimo</span>
    </span>
  );
}

export function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const opts = [
    { v: "light", Icon: Sun, label: "Claro" },
    { v: "system", Icon: Monitor, label: "Sistema" },
    { v: "dark", Icon: Moon, label: "Oscuro" },
  ];
  return (
    <div className="grid grid-cols-3 gap-1 rounded-xl border border-line bg-surface-2 p-1" role="radiogroup" aria-label="Tema">
      {opts.map(({ v, Icon, label }) => (
        <button
          key={v} role="radio" aria-checked={mounted && theme === v} onClick={() => setTheme(v)}
          className={cn(
            "flex h-10 items-center justify-center gap-1.5 rounded-lg text-xs font-medium transition",
            mounted && theme === v ? "bg-surface text-accent shadow-sm" : "text-muted",
          )}
        >
          <Icon className="size-4" /> {label}
        </button>
      ))}
    </div>
  );
}

export function ThemeToggleIcon() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Cambiar tema"
      className="grid size-11 place-items-center rounded-xl border border-line bg-surface/70 text-muted backdrop-blur hover:text-ink"
    >
      {mounted && resolvedTheme === "light" ? <Moon className="size-5" /> : <Sun className="size-5" />}
    </button>
  );
}

export function Delta({ value, invert = false, className }: { value: number | null; invert?: boolean; className?: string }) {
  if (value === null) return <span className={cn("num text-xs text-muted", className)}>—</span>;
  const up = value >= 0;
  const good = invert ? !up : up;
  return (
    <span className={cn("num inline-flex items-center gap-0.5 text-xs font-medium", good ? "text-pos" : "text-neg", className)}>
      {up ? "▲" : "▼"} {Math.abs(value).toFixed(1)}%
    </span>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-line px-6 py-12 text-center">
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
