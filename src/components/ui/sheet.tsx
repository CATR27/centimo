"use client";

import { AnimatePresence, motion, useDragControls, type PanInfo } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

function useDesktop() {
  const [d, setD] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(min-width: 1024px)");
    const on = () => setD(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return d;
}

/** Panel inferior en móvil (arrastrar la cabecera para cerrar); panel lateral derecho en escritorio. */
export function Sheet({ open, onClose, title, subtitle, children }: {
  open: boolean; onClose: () => void; title: string; subtitle?: string; children: ReactNode;
}) {
  const controls = useDragControls();
  const desktop = useDesktop();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) onClose();
  };
  const hidden = desktop ? { x: "100%" } : { y: "100%" };
  const shown = desktop ? { x: 0 } : { y: 0 };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-stretch lg:justify-end">
          <motion.div
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog" aria-modal="true" aria-label={title}
            className="relative flex max-h-[94dvh] w-full flex-col rounded-t-[36px] bg-bg lg:m-4 lg:max-h-none lg:max-w-[440px] lg:rounded-[32px] lg:rounded-tr-none"
            initial={hidden} animate={shown} exit={hidden}
            transition={{ type: "spring", damping: 34, stiffness: 340 }}
            drag={desktop ? false : "y"} dragControls={controls} dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={onDragEnd}
          >
            <div className="shrink-0 touch-none px-6 pb-3 pt-3" onPointerDown={(e) => !desktop && controls.start(e)}>
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted/40 lg:hidden" />
              <div className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center">
                <span />
                <h2 className="text-center text-[15px] font-semibold">
                  {title}{subtitle && <span className="font-normal text-muted"> {subtitle}</span>}
                </h2>
                <button
                  onClick={onClose} onPointerDown={(e) => e.stopPropagation()} aria-label="Cerrar"
                  className="grid size-10 place-items-center rounded-full bg-surface text-ink transition active:scale-95"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto overscroll-contain px-6 pb-safe">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
