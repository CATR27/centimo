"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { BrandLoader } from "@/components/brand-loader";

const KEY = "centimo:booted";

/**
 * Splash de arranque. Se renderiza ya en el HTML del servidor (se ve antes de que cargue JS,
 * útil al abrir la app instalada en iOS) y luego anima el contador. La primera vez por sesión
 * dura más; en recargas posteriores se acorta.
 */
export function AppBoot() {
  const [show, setShow] = useState(true);
  const [duration, setDuration] = useState<number | null>(null);

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem(KEY) === "1"; sessionStorage.setItem(KEY, "1"); } catch {}
    setDuration(seen ? 700 : 1800);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div key="boot" exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="fixed inset-0 z-[100]">
          <BrandLoader duration={duration} onDone={() => setShow(false)} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
