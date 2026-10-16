import type { Account, Category, Settings, Snapshot, Transaction } from "../types";

export interface Repo {
  load(): Promise<Snapshot>;
  saveTx(tx: Transaction): Promise<void>;
  /** Guarda varios movimientos en una sola operación (importaciones). */
  saveTxs(txs: Transaction[]): Promise<void>;
  deleteTx(id: string): Promise<void>;
  saveCategory(c: Category): Promise<void>;
  deleteCategory(id: string): Promise<void>;
  saveAccount(a: Account): Promise<void>;
  deleteAccount(id: string): Promise<void>;
  saveSettings(s: Settings): Promise<void>;
}
