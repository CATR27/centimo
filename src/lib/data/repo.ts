import type { Category, Settings, Snapshot, Transaction } from "../types";

export interface Repo {
  load(): Promise<Snapshot>;
  saveTx(tx: Transaction): Promise<void>;
  deleteTx(id: string): Promise<void>;
  saveCategory(c: Category): Promise<void>;
  deleteCategory(id: string): Promise<void>;
  saveSettings(s: Settings): Promise<void>;
}
