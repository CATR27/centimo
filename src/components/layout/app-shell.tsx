"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Dock, Rail, TopBar } from "@/components/layout/nav";
import { QuickAddProvider } from "@/components/transactions/quick-add";
import { demoSignedIn } from "@/lib/auth";
import { StoreProvider } from "@/lib/store";
import { isDemo } from "@/lib/supabase/env";

/** En modo demo la sesión vive en localStorage, así que el guard es de cliente. */
function useDemoGate() {
  const router = useRouter();
  const [ok, setOk] = useState(!isDemo);
  useEffect(() => {
    if (!isDemo) return;
    if (demoSignedIn()) setOk(true); else router.replace("/login");
  }, [router]);
  return ok;
}

export function AppShell({ children }: { children: ReactNode }) {
  const ok = useDemoGate();
  if (!ok) return <div className="min-h-dvh" />;
  return (
    <StoreProvider>
      <QuickAddProvider>
        <Frame>{children}</Frame>
      </QuickAddProvider>
    </StoreProvider>
  );
}

function Frame({ children }: { children: ReactNode }) {
  usePathname(); // re-render del layout al navegar
  return (
    <div className="min-h-dvh lg:pl-[80px] print:pl-0">
      <Rail />
      <TopBar />
      <main className="mx-auto w-full max-w-2xl px-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-4 lg:max-w-[1400px] lg:px-8 lg:pb-12 lg:pt-10 print:max-w-none print:p-0">
        {children}
      </main>
      <Dock />
    </div>
  );
}
