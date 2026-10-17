"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/** Barra fina que avanza al cambiar de vista: arranca al tocar un enlace interno y termina al cambiar la ruta. */
export function RouteProgress() {
  const pathname = usePathname();
  const [value, setValue] = useState(0);
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const current = useRef(pathname);

  const clear = () => { if (timer.current) clearInterval(timer.current); timer.current = null; };

  // Inicio: clic en un enlace interno hacia otra ruta.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === current.current) return;
      if (hideTimer.current) clearTimeout(hideTimer.current);
      clear();
      setVisible(true);
      setValue(12);
      timer.current = setInterval(() => setValue((v) => (v < 85 ? v + (90 - v) * 0.12 : v)), 180);
    };
    document.addEventListener("click", onClick, true);
    return () => { document.removeEventListener("click", onClick, true); clear(); };
  }, []);

  // Fin: la ruta cambió.
  useEffect(() => {
    if (pathname === current.current) return;
    current.current = pathname;
    clear();
    setValue(100);
    hideTimer.current = setTimeout(() => { setVisible(false); setValue(0); }, 350);
  }, [pathname]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 z-[90] h-[3px] print:hidden"
      style={{ top: "env(safe-area-inset-top)" }}>
      <div className="h-full rounded-r-full bg-accent transition-[width,opacity] duration-200 ease-out"
        style={{ width: `${value}%`, opacity: visible ? 1 : 0 }} />
    </div>
  );
}
