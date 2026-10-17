import {
  Gift, Plane, Coffee, Zap, Dumbbell, Music, Smartphone, Briefcase, PawPrint, Repeat, Tag, TrendingUp, type LucideIcon,
} from "lucide-react";
import { AnimatedIcon, type IconName } from "@/components/animated-icon";

/** Iconos de categoría del diseño v4 (SVG propios); el resto cae a lucide. */
const OWN: Record<string, IconName> = {
  utensils: "utensils", car: "car", home: "home", wallet: "wallet",
  gamepad: "ocio", heart: "salud", bag: "compras", book: "educacion",
};
const LUCIDE: Record<string, LucideIcon> = {
  repeat: Repeat, trending: TrendingUp, tag: Tag, coffee: Coffee, plane: Plane, gift: Gift, zap: Zap,
  dumbbell: Dumbbell, music: Music, phone: Smartphone, briefcase: Briefcase, paw: PawPrint,
};

/** Nombres seleccionables al crear una categoría. */
export const ICON_NAMES = [...Object.keys(OWN), ...Object.keys(LUCIDE)];

export function CategoryIcon({ name, className, idle = false }: { name: string; className?: string; idle?: boolean }) {
  const own = OWN[name];
  if (own) return <AnimatedIcon name={own} idle={idle} className={className} />;
  const Icon = LUCIDE[name] ?? Tag;
  return <Icon className={className} aria-hidden />;
}
