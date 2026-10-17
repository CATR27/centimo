"use client";

import { ArrowLeftRight, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { AnimatedIcon, type IconName } from "@/components/animated-icon";
import { HeroBanner } from "@/components/design";
import { PageHeader, RoundAction } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Field, Input } from "@/components/ui/input";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { Sheet } from "@/components/ui/sheet";
import { accountBalances } from "@/lib/accounts";
import { today } from "@/lib/dates";
import { currencySymbol, formatCompact, formatMoney, toMajor, toMinor } from "@/lib/money";
import { useStore } from "@/lib/store";
import { ACCOUNT_TYPES, NEON_COLORS, type Account, type AccountType } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICON: Record<AccountType, IconName> = { cash: "cash", bank: "banco", card: "tarjeta", savings: "wallet" };

export default function Cuentas() {
  const { ready, accounts, transactions, settings } = useStore();
  const cur = settings.currency;
  const [edit, setEdit] = useState<Partial<Account> | null>(null);
  const [transfer, setTransfer] = useState(false);
  const balances = useMemo(() => accountBalances(transactions, accounts), [transactions, accounts]);
  const total = balances.reduce((a, b) => a + b.balance, 0);

  if (!ready) return <Skeleton className="h-96 rounded-[36px]" />;

  return (
    <div className="space-y-3.5">
      <PageHeader title="Cuentas" sub="Efectivo, bancos y tarjetas"
        right={
          <div className="flex gap-2">
            <RoundAction aria-label="Transferir" disabled={accounts.length < 2} onClick={() => setTransfer(true)} className="disabled:opacity-40"><ArrowLeftRight className="size-5" /></RoundAction>
            <RoundAction aria-label="Nueva cuenta" onClick={() => setEdit({ type: "bank", color: NEON_COLORS[1], openingBalance: 0 })}><AnimatedIcon name="mas" className="size-[21px]" /></RoundAction>
          </div>
        } />

      {accounts.length === 0 ? (
        <EmptyState title="Aún no hay cuentas" hint="Si usas Supabase, ejecuta la migración 0002 para activar cuentas." />
      ) : (
        <>
          <HeroBanner tone="grad" avatar={15}>
            <span className="text-[13px] font-semibold uppercase tracking-[0.14em] muted-ink">Patrimonio total</span>
            <span className="num truncate text-[32px] font-semibold leading-none">{formatMoney(total, cur)}</span>
            <span className="muted-ink num text-[13px]">{accounts.length} {accounts.length === 1 ? "cuenta" : "cuentas"}</span>
          </HeroBanner>

          <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
            {balances.map(({ account: a, balance, income, expense }, i) => {
              const tone = a.type === "card" ? "lime" : i === 0 ? "dark" : "white";
              return (
                <button key={a.id} onClick={() => setEdit(a)}
                  className={cn("flex flex-col gap-4 rounded-[28px] px-[18px] py-4 text-left transition active:scale-[0.99]",
                    tone === "dark" && "card-dark", tone === "lime" && "bg-lime text-lime-ink", tone === "white" && "bg-surface")}>
                  <span className="flex w-full items-center gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full"
                      style={tone === "white" ? { background: a.color, color: "#fff" } : tone === "dark" ? { background: "#eefc7a", color: "#0a0d0c" } : { background: "#0a0d0c", color: "#eefc7a" }}>
                      <AnimatedIcon name={ICON[a.type]} className="size-5" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col leading-tight">
                      <span className="truncate text-base font-semibold">{a.name}</span>
                      <span className="text-xs opacity-60">{ACCOUNT_TYPES.find((t) => t.v === a.type)?.label}</span>
                    </span>
                  </span>
                  <span className="flex w-full items-end justify-between gap-2">
                    <span className={cn("num truncate text-[28px] font-semibold leading-none", balance < 0 && (tone === "dark" ? "text-[#ff7a9c]" : "text-neg"))}>{formatMoney(balance, cur)}</span>
                    <span className="num flex shrink-0 flex-col text-right text-xs opacity-70">
                      <span>▲ {formatCompact(income, cur)}</span><span>▼ {formatCompact(expense, cur)}</span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      <Sheet open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? "Editar cuenta" : "Nueva cuenta"}>
        {edit && <AccountForm key={edit.id ?? "new"} initial={edit} onClose={() => setEdit(null)} />}
      </Sheet>
      <Sheet open={transfer} onClose={() => setTransfer(false)} title="Transferir entre cuentas">
        {transfer && <TransferForm onClose={() => setTransfer(false)} />}
      </Sheet>
    </div>
  );
}

function AccountForm({ initial, onClose }: { initial: Partial<Account>; onClose: () => void }) {
  const { saveAccount, removeAccount, settings, accounts } = useStore();
  const cur = settings.currency;
  const [name, setName] = useState(initial.name ?? "");
  const [type, setType] = useState<AccountType>(initial.type ?? "bank");
  const [color, setColor] = useState(initial.color ?? NEON_COLORS[1]);
  const [opening, setOpening] = useState(initial.openingBalance ? String(toMajor(initial.openingBalance, cur)) : "");

  const save = () => {
    if (!name.trim()) return;
    const n = Number(opening.replace(/[^\d.-]/g, ""));
    saveAccount({ id: initial.id, name: name.trim(), type, color, openingBalance: Number.isFinite(n) ? toMinor(n, cur) : 0 });
    onClose();
  };

  return (
    <div className="space-y-4 pb-3">
      <Field label="Nombre"><Input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Ej. Nequi, Visa, Ahorros" autoFocus={!initial.id} /></Field>
      <div>
        <span className="mb-2 block text-xs font-medium text-muted">Tipo</span>
        <div className="flex flex-wrap gap-2">{ACCOUNT_TYPES.map((t) => <Chip key={t.v} active={type === t.v} onClick={() => setType(t.v)}>{t.label}</Chip>)}</div>
      </div>
      <div>
        <span className="mb-2 block text-xs font-medium text-muted">Color</span>
        <div className="flex flex-wrap gap-2.5">
          {NEON_COLORS.map((c) => (
            <button key={c} onClick={() => setColor(c)} aria-label={`Color ${c}`} aria-pressed={color === c}
              className={cn("size-10 rounded-full ring-offset-2 ring-offset-bg transition", color === c && "ring-2")}
              style={{ background: c, ["--tw-ring-color" as string]: c }} />
          ))}
        </div>
      </div>
      <Field label={`Saldo inicial (${currencySymbol(cur)})`}>
        <Input value={opening} onChange={(e) => setOpening(e.target.value.replace(/[^\d.-]/g, ""))} inputMode="decimal" placeholder="0" />
      </Field>
      <div className="flex gap-2 pt-1">
        {initial.id && accounts.length > 1 && (
          <Button variant="danger" size="icon" className="size-14" aria-label="Eliminar cuenta"
            onClick={() => { if (confirm("¿Eliminar cuenta? Sus movimientos pasarán a la cuenta por defecto.")) { removeAccount(initial.id!); onClose(); } }}>
            <Trash2 className="size-5" />
          </Button>
        )}
        <Button size="lg" className="flex-1" disabled={!name.trim()} onClick={save}>Guardar</Button>
      </div>
    </div>
  );
}

function TransferForm({ onClose }: { onClose: () => void }) {
  const { accounts, settings, addTransfer } = useStore();
  const cur = settings.currency;
  const [fromId, setFromId] = useState(accounts[0]?.id ?? "");
  const [toId, setToId] = useState(accounts[1]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const minor = toMinor(Number(amount.replace(/[^\d.]/g, "")) || 0, cur);
  const valid = minor > 0 && fromId && toId && fromId !== toId;

  const Pick = ({ label, value, set }: { label: string; value: string; set: (v: string) => void }) => (
    <div role="radiogroup" aria-label={label}>
      <span className="mb-2 block text-xs font-medium text-muted">{label}</span>
      <div className="flex flex-wrap gap-2">{accounts.map((a) => <Chip key={a.id} active={value === a.id} onClick={() => set(a.id)}>{a.name}</Chip>)}</div>
    </div>
  );

  return (
    <div className="space-y-4 pb-3">
      <Pick label="Desde" value={fromId} set={setFromId} />
      <Pick label="Hacia" value={toId} set={setToId} />
      {fromId === toId && <p role="alert" className="text-xs text-neg">Elige cuentas distintas.</p>}
      <Field label={`Monto (${currencySymbol(cur)})`}><Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0" autoFocus /></Field>
      <Field label="Fecha"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      <Button size="lg" className="w-full" disabled={!valid} onClick={() => { addTransfer({ fromId, toId, amount: minor, date }); onClose(); }}>
        Transferir {minor > 0 ? formatMoney(minor, cur) : ""}
      </Button>
      <p className="text-center text-xs text-muted">Las transferencias no cuentan como ingreso ni gasto en tus análisis.</p>
    </div>
  );
}
