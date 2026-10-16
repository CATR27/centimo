import type { Account, Category, Settings, Snapshot, Transaction } from "../types";
import type { Repo } from "./repo";
import { DEFAULT_ACCOUNTS, demoSnapshot } from "./seed";

const KEY = "centimo:demo:v1";

function read(): Snapshot {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      // Tolera datos guardados por versiones anteriores (sin cuentas ni presupuesto global).
      const snap = JSON.parse(raw) as Partial<Snapshot> & Pick<Snapshot, "categories" | "transactions" | "settings">;
      return {
        ...snap,
        accounts: snap.accounts?.length ? snap.accounts : DEFAULT_ACCOUNTS.slice(0, 1),
        settings: { ...snap.settings, monthlyBudget: snap.settings.monthlyBudget ?? null },
      };
    }
  } catch {}
  const s = demoSnapshot();
  write(s);
  return s;
}
function write(s: Snapshot) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
}
const upsert = <T extends { id: string }>(list: T[], item: T) =>
  list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [item, ...list];

export const localRepo: Repo = {
  async load() { return read(); },
  async saveTx(tx: Transaction) { const s = read(); write({ ...s, transactions: upsert(s.transactions, tx) }); },
  async saveTxs(txs: Transaction[]) {
    const s = read();
    write({ ...s, transactions: txs.reduce((list, t) => upsert(list, t), s.transactions) });
  },
  async deleteTx(id) { const s = read(); write({ ...s, transactions: s.transactions.filter((t) => t.id !== id) }); },
  async saveCategory(c: Category) { const s = read(); write({ ...s, categories: upsert(s.categories, c) }); },
  async deleteCategory(id) {
    const s = read();
    write({
      ...s,
      categories: s.categories.filter((c) => c.id !== id),
      transactions: s.transactions.map((t) => (t.categoryId === id ? { ...t, categoryId: null } : t)),
    });
  },
  async saveAccount(a: Account) { const s = read(); write({ ...s, accounts: upsert(s.accounts, a) }); },
  async deleteAccount(id) {
    const s = read();
    write({
      ...s,
      accounts: s.accounts.filter((a) => a.id !== id),
      transactions: s.transactions.map((t) => (t.accountId === id ? { ...t, accountId: null } : t)),
    });
  },
  async saveSettings(settings: Settings) { write({ ...read(), settings }); },
};
