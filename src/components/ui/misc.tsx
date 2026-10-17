"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { AnimatedIcon } from "@/components/animated-icon";
import { Avatar } from "@/components/avatar";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-3xl bg-surface", className)} />;
}

/** Logo oficial. El horizontal alterna según el tema (texto oscuro en claro, texto claro en oscuro). */
export function Logo({ className, iconOnly, forceLight }: { className?: string; iconOnly?: boolean; forceLight?: boolean }) {
  if (iconOnly) {
    return <Image src="/brand/icon.png" alt="Centimo" width={512} height={512} priority className={cn("size-9 rounded-[28%]", className)} />;
  }
  return (
    <span className={cn("inline-flex", className)}>
      <Image src="/brand/logo-light.png" alt="Centimo" width={749} height={200} priority
        className={cn("h-9 w-auto", !forceLight && "dark:hidden")} />
      {!forceLight && (
        <Image src="/brand/logo-dark.png" alt="Centimo" width={749} height={200} priority className="hidden h-9 w-auto dark:block" />
      )}
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
    <div className="grid grid-cols-3 gap-1 rounded-full bg-surface-2 p-1" role="radiogroup" aria-label="Tema">
      {opts.map(({ v, Icon, label }) => (
        <button
          key={v} role="radio" aria-checked={mounted && theme === v} onClick={() => setTheme(v)}
          className={cn(
            "flex h-10 items-center justify-center gap-1.5 rounded-full text-xs font-semibold transition",
            mounted && theme === v ? "bg-accent text-accent-ink" : "text-muted",
          )}
        >
          <Icon className="size-4" /> {label}
        </button>
      ))}
    </div>
  );
}

export function ThemeToggleIcon({ className, dark }: { className?: string; dark?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Cambiar tema"
      className={cn("grid size-12 place-items-center rounded-full transition",
        dark ? "bg-dk-3 text-dk-text hover:bg-dk-line" : "bg-surface text-ink hover:bg-surface-2", className)}
    >
      <AnimatedIcon name={mounted && resolvedTheme === "light" ? "luna" : "sol"} className="size-5" strokeWidth={2} />
    </button>
  );
}

export function Delta({ value, invert = false, className }: { value: number | null; invert?: boolean; className?: string }) {
  if (value === null) return <span className={cn("num text-xs text-muted", className)}>—</span>;
  const up = value >= 0;
  const good = invert ? !up : up;
  return (
    <span className={cn("num inline-flex items-center gap-0.5 text-xs font-semibold", good ? "text-pos" : "text-neg", className)}>
      {up ? "▲" : "▼"} {Math.abs(value).toFixed(1)}%
    </span>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="grid place-items-center rounded-[28px] border-2 border-dashed border-muted/30 px-6 py-10 text-center">
      <Avatar n={10} className="mb-1 size-24" />
      <p className="text-sm font-semibold">{title}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

/** Oculta o muestra todos los montos de la app. */
export function PrivacyToggle({ className, dark }: { className?: string; dark?: boolean }) {
  const { privacy, togglePrivacy } = useStore();
  return (
    <button
      onClick={togglePrivacy} aria-pressed={privacy} aria-label={privacy ? "Mostrar montos" : "Ocultar montos"}
      title={privacy ? "Mostrar montos" : "Ocultar montos"}
      className={cn("relative grid size-12 place-items-center rounded-full transition",
        dark
          ? (privacy ? "bg-lime text-lime-ink" : "bg-dk-3 text-dk-text hover:bg-dk-line")
          : (privacy ? "bg-accent text-accent-ink" : "bg-surface text-ink hover:bg-surface-2"), className)}
    >
      <AnimatedIcon name="privado" className="size-5" />
      {privacy && <span aria-hidden className="absolute h-0.5 w-6 -rotate-45 rounded-full bg-current" />}
    </button>
  );
}
