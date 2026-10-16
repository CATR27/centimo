"use client";

import { AnimatePresence, motion, useDragControls, type PanInfo } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

/** Bottom-sheet móvil (arrastrar la cabecera para cerrar); en pantallas grandes es un modal centrado. */
export function Sheet({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode;
}) {
  const controls = useDragControls();

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

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog" aria-modal="true" aria-label={title}
            className="relative flex max-h-[92dvh] w-full flex-col rounded-t-3xl border border-line bg-surface md:max-w-md md:rounded-3xl"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 340 }}
            drag="y" dragControls={controls} dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={onDragEnd}
          >
            <div className="shrink-0 touch-none px-5 pb-2 pt-2.5" onPointerDown={(e) => controls.start(e)}>
              <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-line md:hidden" />
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">{title}</h2>
                <button
                  onClick={onClose} onPointerDown={(e) => e.stopPropagation()} aria-label="Cerrar"
                  className="grid size-10 place-items-center rounded-full text-muted hover:bg-surface-2"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto overscroll-contain px-5 pb-safe">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
