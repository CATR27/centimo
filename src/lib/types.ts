export type TxType = "expense" | "income";
export type TxStatus = "paid" | "planned";
export type Recurrence = "weekly" | "monthly" | "yearly" | null;

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  kind: TxType;
  /** presupuesto mensual en unidades menores (null = sin presupuesto) */
  monthlyBudget: number | null;
}

export type AccountType = "cash" | "bank" | "card" | "savings";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  color: string;
  /** saldo inicial en unidades menores */
  openingBalance: number;
}

export const ACCOUNT_TYPES: { v: AccountType; label: string }[] = [
  { v: "cash", label: "Efectivo" }, { v: "bank", label: "Banco" },
  { v: "card", label: "Tarjeta" }, { v: "savings", label: "Ahorros" },
];

export interface Transaction {
  id: string;
  categoryId: string | null;
  /** unidades menores (centavos), siempre positivo */
  amount: number;
  type: TxType;
  note: string;
  /** YYYY-MM-DD */
  date: string;
  status: TxStatus;
  recurrence: Recurrence;
  /** cuenta a la que pertenece (null = cuenta por defecto) */
  accountId?: string | null;
  /** etiquetas libres, en minúsculas y sin # */
  tags?: string[];
  /** par de movimientos de una transferencia entre cuentas (se excluye de los análisis) */
  transferId?: string | null;
}

export interface Settings {
  currency: string;
  displayName: string;
  /** presupuesto global mensual en unidades menores (null = sin límite) */
  monthlyBudget: number | null;
}

export interface Snapshot {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  settings: Settings;
}

export const NEON_COLORS = [
  "#00ff9d", "#22d3ee", "#ff2e97", "#ffb800", "#a78bfa",
  "#ff6b35", "#4d7cff", "#c6ff00", "#ff5d73", "#2dd4bf",
] as const;
