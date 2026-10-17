import { AppShell } from "@/components/layout/app-shell";
import { RouteProgress } from "@/components/route-progress";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RouteProgress />
      <AppShell>{children}</AppShell>
    </>
  );
}
