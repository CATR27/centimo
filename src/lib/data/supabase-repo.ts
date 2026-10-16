import { supabase } from "../supabase/client";
import type { Category, Recurrence, Settings, Snapshot, Transaction, TxStatus, TxType } from "../types";
import type { Repo } from "./repo";

interface TxRow {
  id: string; category_id: string | null; amount: number; type: TxType;
  note: string; date: string; status: TxStatus; recurrence: Recurrence;
}
interface CatRow {
  id: string; name: string; icon: string; color: string; kind: TxType; monthly_budget: number | null;
}

const toTx = (r: TxRow): Transaction => ({
  id: r.id, categoryId: r.category_id, amount: Number(r.amount), type: r.type,
  note: r.note, date: r.date, status: r.status, recurrence: r.recurrence,
});
const toCat = (r: CatRow): Category => ({
  id: r.id, name: r.name, icon: r.icon, color: r.color, kind: r.kind,
  monthlyBudget: r.monthly_budget === null ? null : Number(r.monthly_budget),
});

const check = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};
const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export const supabaseRepo: Repo = {
  async load(): Promise<Snapshot> {
    const sb = supabase();
    const [cats, txs, profile] = await Promise.all([
      sb.from("categories").select("*").order("created_at"),
      sb.from("transactions").select("*").order("date", { ascending: false }).limit(5000),
      sb.from("profiles").select("display_name,currency").maybeSingle(),
    ]);
    check(cats.error); check(txs.error); check(profile.error);
    return {
      categories: (cats.data as CatRow[]).map(toCat),
      transactions: (txs.data as TxRow[]).map(toTx),
      settings: {
        currency: profile.data?.currency ?? "COP",
        displayName: profile.data?.display_name ?? "",
      },
    };
  },
  async saveTx(tx) {
    const row = {
      ...(isUuid(tx.id) ? { id: tx.id } : {}),
      category_id: tx.categoryId, amount: tx.amount, type: tx.type, note: tx.note,
      date: tx.date, status: tx.status, recurrence: tx.recurrence,
    };
    check((await supabase().from("transactions").upsert(row)).error);
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
  async saveSettings(s: Settings) {
    const { data } = await supabase().auth.getUser();
    if (!data.user) throw new Error("Sesión expirada");
    check((await supabase().from("profiles").upsert({
      id: data.user.id, display_name: s.displayName, currency: s.currency,
    })).error);
  },
};
