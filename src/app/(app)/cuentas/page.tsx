"use client";

import { ArrowLeftRight, CreditCard, Landmark, PiggyBank, Plus, Trash2, Wallet, type LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

const ICON: Record<AccountType, LucideIcon> = { cash: Wallet, bank: Landmark, card: CreditCard, savings: PiggyBank };

export default function Cuentas() {
  const { ready, accounts, transactions, settings } = useStore();
  const cur = settings.currency;
  const [edit, setEdit] = useState<Partial<Account> | null>(null);
  const [transfer, setTransfer] = useState(false);
  const balances = useMemo(() => accountBalances(transactions, accounts), [transactions, accounts]);
  const total = balances.reduce((a, b) => a + b.balance, 0);

  if (!ready) return <Skeleton className="h-96 rounded-[36px]" />;

  return (
    <div>
      <PageHeader title="Cuentas" sub="Efectivo, bancos y tarjetas"
        right={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setTransfer(true)} disabled={accounts.length < 2}><ArrowLeftRight className="size-4" /> Transferir</Button>
            <Button onClick={() => setEdit({ type: "bank", color: NEON_COLORS[1], openingBalance: 0 })}><Plus className="size-4" /> Nueva</Button>
          </div>
        } />

      {accounts.length === 0 ? (
        <EmptyState title="Aún no hay cuentas" hint="Si usas Supabase, ejecuta la migración 0002 para activar cuentas." />
      ) : (
        <>
          <Card className="grad-card mb-6 rounded-[36px] border-0 p-6">
            <p className="muted-ink text-xs font-medium">Patrimonio total</p>
            <p className="num mt-2 truncate text-[clamp(2rem,8vw,3.25rem)] font-semibold leading-none tracking-tight">{formatMoney(total, cur)}</p>
            <p className="muted-ink num mt-2 text-xs">{accounts.length} {accounts.length === 1 ? "cuenta" : "cuentas"}</p>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {balances.map(({ account: a, balance, income, expense }) => {
              const Icon = ICON[a.type];
              return (
                <button key={a.id} onClick={() => setEdit(a)} className="neon-card rounded-[28px] border border-line/70 bg-surface p-5 text-left transition active:scale-[0.99]">
                  <div className="flex items-center gap-3">
                    <span className="grid size-12 place-items-center rounded-full" style={{ background: `color-mix(in srgb, ${a.color} 20%, transparent)`, color: a.color }}><Icon className="size-5" /></span>
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold">{a.name}</p>
                      <p className="text-xs text-muted">{ACCOUNT_TYPES.find((t) => t.v === a.type)?.label}</p>
                    </div>
                  </div>
                  <p className={cn("num mt-5 truncate text-2xl font-semibold", balance < 0 && "text-neg")}>{formatMoney(balance, cur)}</p>
                  <div className="num mt-2 flex gap-4 text-xs">
                    <span className="text-pos">▲ {formatCompact(income, cur)}</span>
                    <span className="text-muted">▼ {formatCompact(expense, cur)}</span>
                  </div>
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
