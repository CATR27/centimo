import { Skeleton } from "@/components/ui/misc";

/** Esqueletos con la forma de cada pantalla (se muestran mientras carga la vista). */
export function PageSkeleton({ variant = "default" }: { variant?: "default" | "dashboard" | "list" | "analysis" }) {
  if (variant === "dashboard") {
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.9fr)_minmax(0,0.85fr)]" aria-busy>
        <Skeleton className="h-[34rem] rounded-[40px]" />
        <Skeleton className="h-[34rem] rounded-[40px]" />
        <div className="grid content-start gap-6 lg:col-span-2 lg:grid-cols-2 xl:col-span-1 xl:grid-cols-1">
          <Skeleton className="h-52 rounded-[36px]" />
          <Skeleton className="h-36 rounded-[36px]" />
        </div>
      </div>
    );
  }
  if (variant === "list") {
    return (
      <div aria-busy className="space-y-4">
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-12 rounded-full" />
        <div className="flex gap-2"><Skeleton className="h-10 w-20 rounded-full" /><Skeleton className="h-10 w-24 rounded-full" /><Skeleton className="h-10 w-24 rounded-full" /></div>
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-[28px]" />)}
      </div>
    );
  }
  if (variant === "analysis") {
    return (
      <div aria-busy className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-10 w-48 lg:col-span-2" />
        <div className="grid grid-cols-2 gap-2.5 lg:col-span-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-[28px]" />)}</div>
        <Skeleton className="h-72 rounded-[36px]" />
        <Skeleton className="h-72 rounded-[36px]" />
      </div>
    );
  }
  return (
    <div aria-busy className="space-y-4">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-40 rounded-[36px]" />
      <Skeleton className="h-64 rounded-[36px]" />
    </div>
  );
}
