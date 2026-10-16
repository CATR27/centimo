import type { Account, Transaction } from "./types";

/** Cuenta efectiva de un movimiento: la suya o, si no tiene, la primera (cuenta por defecto). */
export const accountOf = (t: Transaction, accounts: Account[]) =>
  (t.accountId && accounts.some((a) => a.id === t.accountId) ? t.accountId : accounts[0]?.id) ?? null;

export interface AccountBalance { account: Account; balance: number; income: number; expense: number; count: number }

/** Saldo = saldo inicial + ingresos pagados − gastos pagados (incluye transferencias). */
export function accountBalances(txs: Transaction[], accounts: Account[]): AccountBalance[] {
  const map = new Map(accounts.map((a) => [a.id, { account: a, balance: a.openingBalance, income: 0, expense: 0, count: 0 }]));
  for (const t of txs) {
    if (t.status !== "paid") continue;
    const id = accountOf(t, accounts);
    const b = id ? map.get(id) : undefined;
    if (!b) continue;
    b.count++;
    if (t.type === "income") { b.balance += t.amount; b.income += t.amount; }
    else { b.balance -= t.amount; b.expense += t.amount; }
  }
  return [...map.values()];
}

/** Normaliza etiquetas: minúsculas, sin #, únicas, máx. 8. */
export function parseTags(input: string): string[] {
  const out = new Set<string>();
  for (const raw of input.split(/[\s,]+/)) {
    const t = raw.replace(/^#+/, "").trim().toLowerCase().slice(0, 24);
    if (t) out.add(t);
  }
  return [...out].slice(0, 8);
}
