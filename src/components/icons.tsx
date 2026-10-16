import {
  BookOpen, Car, Gamepad2, Heart, Home, Repeat, ShoppingBag, Tag, TrendingUp, Utensils, Wallet,
  Coffee, Plane, Gift, Zap, Dumbbell, Music, Smartphone, Briefcase, PawPrint, type LucideIcon,
} from "lucide-react";

export const ICONS: Record<string, LucideIcon> = {
  utensils: Utensils, car: Car, home: Home, gamepad: Gamepad2, heart: Heart, repeat: Repeat,
  bag: ShoppingBag, book: BookOpen, wallet: Wallet, trending: TrendingUp, tag: Tag,
  coffee: Coffee, plane: Plane, gift: Gift, zap: Zap, dumbbell: Dumbbell, music: Music,
  phone: Smartphone, briefcase: Briefcase, paw: PawPrint,
};

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Tag;
  return <Icon className={className} aria-hidden />;
}
