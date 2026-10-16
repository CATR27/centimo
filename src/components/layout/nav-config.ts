import type { IconName } from "@/components/animated-icon";

export interface NavItem { href: string; label: string; icon: IconName; hint?: string }
export interface NavGroup { title: string; items: NavItem[] }

/** Una sola fuente de verdad para el riel de escritorio y el Hub móvil. */
export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Principal",
    items: [
      { href: "/dashboard", label: "Panel", icon: "panel", hint: "Resumen del periodo" },
      { href: "/transacciones", label: "Historial", icon: "historial", hint: "Todos los movimientos" },
      { href: "/proximos", label: "Próximos", icon: "proximos", hint: "Pagos programados" },
      { href: "/calendario", label: "Calendario", icon: "calendario", hint: "Tu mes día a día" },
      { href: "/hub", label: "Hub", icon: "hub", hint: "Todo en un lugar" },
    ],
  },
  {
    title: "Análisis",
    items: [
      { href: "/analisis", label: "Análisis", icon: "analisis", hint: "Gráficas y patrones" },
      { href: "/suscripciones", label: "Suscripciones", icon: "suscripciones", hint: "Pagos recurrentes" },
      { href: "/reporte", label: "Reporte", icon: "reporte", hint: "Resumen mensual" },
    ],
  },
  {
    title: "Gestión",
    items: [
      { href: "/categorias", label: "Categorías", icon: "categorias", hint: "Colores y presupuestos" },
      { href: "/ajustes", label: "Ajustes", icon: "ajustes", hint: "Moneda, tema, datos" },
    ],
  },
];
