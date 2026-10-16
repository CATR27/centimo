import { readdirSync } from "node:fs";
import { join } from "node:path";
import { LottieIconsProvider } from "@/components/animated-icon";
import { AppShell } from "@/components/layout/app-shell";

/** Lista los Lottie JSON puestos en public/animated-icons (animatedicons.co) para usarlos en la navegación. */
function lottieNames() {
  try {
    return readdirSync(join(process.cwd(), "public", "animated-icons"))
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.slice(0, -5));
  } catch {
    return [];
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <LottieIconsProvider names={lottieNames()}>
      <AppShell>{children}</AppShell>
    </LottieIconsProvider>
  );
}
