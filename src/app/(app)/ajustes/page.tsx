"use client";

import { Download, LogOut, Tags } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HeroBanner } from "@/components/design";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, SectionTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ThemeSwitch } from "@/components/ui/misc";
import { signOut } from "@/lib/auth";
import { CURRENCIES, currencySymbol, toMajor, toMinor } from "@/lib/money";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function Ajustes() {
  const { settings, updateSettings, transactions, categories, accounts, demo } = useStore();
  const router = useRouter();

  function exportCsv() {
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const rows = [["fecha", "tipo", "estado", "categoria", "cuenta", "monto", "nota", "etiquetas", "recurrencia"].join(",")];
    for (const t of [...transactions].sort((a, b) => a.date.localeCompare(b.date))) {
      rows.push([
        t.date, t.type, t.status, esc(categories.find((c) => c.id === t.categoryId)?.name ?? ""),
        esc(accounts.find((a) => a.id === (t.accountId ?? accounts[0]?.id))?.name ?? ""),
        toMajor(t.amount, settings.currency), esc(t.note), esc((t.tags ?? []).join(" ")), t.recurrence ?? "",
      ].join(","));
    }
    const url = URL.createObjectURL(new Blob(["﻿" + rows.join("\n")], { type: "text/csv;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "centimo.csv" });
    a.click();
    URL.revokeObjectURL(url);
  }

  async function logout() {
    await signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="space-y-3.5">
      <PageHeader title="Ajustes" />
      <HeroBanner tone="lime" avatar={16}>
        <span className="text-[13px] font-semibold uppercase tracking-[0.14em] muted-ink">Tu cuenta</span>
        <span className="truncate text-2xl font-semibold leading-tight">{settings.displayName || "Trader"}</span>
        <span className="muted-ink text-[13px]">Moneda {settings.currency}</span>
      </HeroBanner>
      <Card className="space-y-3">
        <SectionTitle>Perfil</SectionTitle>
        <Input defaultValue={settings.displayName} placeholder="Tu nombre" maxLength={40} aria-label="Nombre"
          onBlur={(e) => e.target.value.trim() !== settings.displayName && updateSettings({ displayName: e.target.value.trim() })} />
      </Card>
      <Card className="space-y-3">
        <SectionTitle>Presupuesto global del mes</SectionTitle>
        <Input
          key={`${settings.currency}-${settings.monthlyBudget ?? "none"}`} inputMode="decimal" aria-label="Presupuesto mensual"
          placeholder={`Sin límite (${currencySymbol(settings.currency)})`}
          defaultValue={settings.monthlyBudget ? String(toMajor(settings.monthlyBudget, settings.currency)) : ""}
          onBlur={(e) => {
            const n = Number(e.target.value.replace(/[^\d.]/g, ""));
            const next = n > 0 ? toMinor(n, settings.currency) : null;
            if (next !== settings.monthlyBudget) updateSettings({ monthlyBudget: next });
          }}
        />
        <p className="text-xs text-muted">Te avisamos al llegar al 80% y al 100% del gasto del mes. También puedes poner un límite por categoría.</p>
      </Card>
      <Card>
        <SectionTitle>Apariencia</SectionTitle>
        <ThemeSwitch />
      </Card>
      <Card>
        <SectionTitle>Moneda</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {CURRENCIES.map((c) => (
            <button key={c.code} onClick={() => updateSettings({ currency: c.code })} aria-pressed={settings.currency === c.code} title={c.label}
              className={cn("num grid h-12 place-items-center rounded-full text-sm font-semibold transition", settings.currency === c.code ? "bg-accent text-accent-ink" : "bg-surface-2 text-muted")}>
              {c.code}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">Cambiar la moneda solo cambia el formato; no convierte los montos.</p>
      </Card>
      <Card className="divide-y divide-line p-0">
        <Link href="/categorias" className="flex h-14 items-center gap-3 px-4 text-sm"><Tags className="size-5 text-muted" /> Gestionar categorías</Link>
        <button onClick={exportCsv} className="flex h-14 w-full items-center gap-3 px-4 text-left text-sm"><Download className="size-5 text-muted" /> Exportar CSV</button>
      </Card>
      {demo && (
        <button className="w-full text-center text-xs text-muted underline"
          onClick={() => { if (confirm("¿Restablecer los datos de demostración?")) { localStorage.removeItem("centimo:demo:v1"); location.reload(); } }}>
          Restablecer datos de demostración
        </button>
      )}
      <Button variant="danger" size="lg" className="w-full" onClick={logout}><LogOut className="size-5" /> Cerrar sesión</Button>
    </div>
  );
}
