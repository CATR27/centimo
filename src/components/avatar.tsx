import { cn } from "@/lib/utils";

/** Personajes del diseño (public/avatars/c01–c18.svg) con balanceo suave; cada uno con fase propia. */
export function Avatar({ n, className, float = true, priority }: { n: number; className?: string; float?: boolean; priority?: boolean }) {
  const f = `c${String(n).padStart(2, "0")}`;
  return (
    <span className={cn("grid shrink-0 place-items-center", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/avatars/${f}.svg`} alt="" draggable={false}
        loading={priority ? "eager" : "lazy"} decoding="async"
        className={cn("block size-full object-contain", float && "av-float")}
        style={{ "--d": `${-((n * 1.7) % 6.5).toFixed(1)}s` } as React.CSSProperties}
      />
    </span>
  );
}
