import { supabase } from "../supabase/client";
import type {
  Account, AccountType, Category, Recurrence, Settings, Snapshot, Transaction, TxStatus, TxType,
} from "../types";
import type { Repo } from "./repo";

interface TxRow {
  id: string; category_id: string | null; amount: number; type: TxType;
  note: string; date: string; status: TxStatus; recurrence: Recurrence;
  account_id?: string | null; transfer_id?: string | null; tags?: string[] | null;
}
interface CatRow {
  id: string; name: string; icon: string; color: string; kind: TxType; monthly_budget: number | null;
}
interface AccRow {
  id: string; name: string; type: AccountType; color: string; opening_balance: number;
}

const toTx = (r: TxRow): Transaction => ({
  id: r.id, categoryId: r.category_id, amount: Number(r.amount), type: r.type,
  note: r.note, date: r.date, status: r.status, recurrence: r.recurrence,
  accountId: r.account_id ?? null, transferId: r.transfer_id ?? null, tags: r.tags ?? [],
});
const toCat = (r: CatRow): Category => ({
  id: r.id, name: r.name, icon: r.icon, color: r.color, kind: r.kind,
  monthlyBudget: r.monthly_budget === null ? null : Number(r.monthly_budget),
});
const toAcc = (r: AccRow): Account => ({
  id: r.id, name: r.name, type: r.type, color: r.color, openingBalance: Number(r.opening_balance),
});

const check = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};
const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

/**
 * La migración 0002 añade cuentas, etiquetas y transferencias. Mientras no esté aplicada
 * (la tabla `accounts` no existe) la app funciona igual y simplemente no envía esas columnas.
 */
let migrated = false;

const txRow = (tx: Transaction) => ({
  ...(isUuid(tx.id) ? { id: tx.id } : {}),
  category_id: tx.categoryId, amount: tx.amount, type: tx.type, note: tx.note,
  date: tx.date, status: tx.status, recurrence: tx.recurrence,
  ...(migrated ? {
    account_id: tx.accountId && isUuid(tx.accountId) ? tx.accountId : null,
    transfer_id: tx.transferId && isUuid(tx.transferId) ? tx.transferId : null,
    tags: tx.tags ?? [],
  } : {}),
});

export const supabaseRepo: Repo = {
  async load(): Promise<Snapshot> {
    const sb = supabase();
    const [cats, txs, profile, accs] = await Promise.all([
      sb.from("categories").select("*").order("created_at"),
      sb.from("transactions").select("*").order("date", { ascending: false }).limit(5000),
      sb.from("profiles").select("*").maybeSingle(),
      sb.from("accounts").select("*").order("created_at"),
    ]);
    check(cats.error); check(txs.error); check(profile.error);
    migrated = !accs.error;
    return {
      accounts: accs.error ? [] : (accs.data as AccRow[]).map(toAcc),
      categories: (cats.data as CatRow[]).map(toCat),
      transactions: (txs.data as TxRow[]).map(toTx),
      settings: {
        currency: profile.data?.currency ?? "COP",
        displayName: profile.data?.display_name ?? "",
        monthlyBudget: profile.data?.monthly_budget == null ? null : Number(profile.data.monthly_budget),
      },
    };
  },
  async saveTx(tx) {
    check((await supabase().from("transactions").upsert(txRow(tx))).error);
  },
  async saveTxs(txs) {
    if (!txs.length) return;
    // Lotes para no exceder el tamaño de petición con importaciones grandes.
    for (let i = 0; i < txs.length; i += 200) {
      check((await supabase().from("transactions").upsert(txs.slice(i, i + 200).map(txRow))).error);
    }
  },
  async deleteTx(id) { check((await supabase().from("transactions").delete().eq("id", id)).error); },
  async saveCategory(c) {
    const row = {
      ...(isUuid(c.id) ? { id: c.id } : {}),
      name: c.name, icon: c.icon, color: c.color, kind: c.kind, monthly_budget: c.monthlyBudget,
    };
    check((await supabase().from("categories").upsert(row)).error);
  },
  async deleteCategory(id) { check((await supabase().from("categories").delete().eq("id", id)).error); },
  async saveAccount(a) {
    if (!migrated) throw new Error("Aplica la migración 0002 en Supabase para usar cuentas.");
    const row = {
      ...(isUuid(a.id) ? { id: a.id } : {}),
      name: a.name, type: a.type, color: a.color, opening_balance: a.openingBalance,
    };
    check((await supabase().from("accounts").upsert(row)).error);
  },
  async deleteAccount(id) {
    if (!migrated) throw new Error("Aplica la migración 0002 en Supabase para usar cuentas.");
    check((await supabase().from("accounts").delete().eq("id", id)).error);
  },
  async saveSettings(s: Settings) {
    const { data } = await supabase().auth.getUser();
    if (!data.user) throw new Error("Sesión expirada");
    // monthly_budget solo se envía si hay valor: así funciona aunque la migración 0002 aún no se haya aplicado.
    check((await supabase().from("profiles").upsert({
      id: data.user.id, display_name: s.displayName, currency: s.currency,
      ...(s.monthlyBudget !== null ? { monthly_budget: s.monthlyBudget } : {}),
    })).error);
  },
};
