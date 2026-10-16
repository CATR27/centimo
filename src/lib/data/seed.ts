import { addDaysISO, today } from "../dates";
import type { Category, Snapshot, Transaction } from "../types";

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "c-food", name: "Comida", icon: "utensils", color: "#ff6b35", kind: "expense", monthlyBudget: 600_000 },
  { id: "c-transit", name: "Transporte", icon: "car", color: "#22d3ee", kind: "expense", monthlyBudget: 250_000 },
  { id: "c-home", name: "Hogar", icon: "home", color: "#4d7cff", kind: "expense", monthlyBudget: 1_200_000 },
  { id: "c-fun", name: "Ocio", icon: "gamepad", color: "#ff2e97", kind: "expense", monthlyBudget: 300_000 },
  { id: "c-health", name: "Salud", icon: "heart", color: "#00ff9d", kind: "expense", monthlyBudget: null },
  { id: "c-subs", name: "Suscripciones", icon: "repeat", color: "#a78bfa", kind: "expense", monthlyBudget: 120_000 },
  { id: "c-shop", name: "Compras", icon: "bag", color: "#ffb800", kind: "expense", monthlyBudget: 350_000 },
  { id: "c-edu", name: "Educación", icon: "book", color: "#c6ff00", kind: "expense", monthlyBudget: null },
  { id: "c-salary", name: "Salario", icon: "wallet", color: "#00ff9d", kind: "income", monthlyBudget: null },
  { id: "c-other", name: "Otros ingresos", icon: "trending", color: "#2dd4bf", kind: "income", monthlyBudget: null },
];

/** PRNG determinista para que el demo se vea igual en cada carga. */
function rng(seed: number) {
  return () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

export function demoSnapshot(): Snapshot {
  const r = rng(42);
  const t = today();
  const txs: Transaction[] = [];
  let n = 0;
  const add = (p: Omit<Transaction, "id" | "recurrence" | "status"> & Partial<Transaction>) =>
    txs.push({ id: `d-${n++}`, status: "paid", recurrence: null, ...p });

  const spend: [string, number, number, string[]][] = [
    ["c-food", 12_000, 70_000, ["Almuerzo", "Domicilio", "Supermercado", "Café", "Cena fuera"]],
    ["c-transit", 6_000, 40_000, ["Uber", "Gasolina", "Metro", "Parqueadero"]],
    ["c-fun", 15_000, 90_000, ["Cine", "Salida con amigos", "Videojuego", "Concierto"]],
    ["c-shop", 25_000, 160_000, ["Ropa", "Amazon", "Tecnología", "Regalo"]],
    ["c-health", 20_000, 110_000, ["Farmacia", "Consulta", "Gimnasio"]],
    ["c-home", 20_000, 120_000, ["Aseo", "Reparación", "Mercado"]],
  ];
  for (let i = 0; i < 120; i++) {
    const date = addDaysISO(t, -i);
    const count = r() < 0.55 ? 1 : r() < 0.3 ? 2 : 0;
    for (let k = 0; k < count; k++) {
      const [cat, lo, hi, notes] = spend[Math.floor(r() * spend.length)];
      add({
        categoryId: cat, type: "expense", date,
        amount: Math.round((lo + r() * (hi - lo)) / 500) * 500,
        note: notes[Math.floor(r() * notes.length)],
      });
    }
  }
  // Ingresos y fijos mensuales (últimos 4 meses)
  for (let m = 0; m < 4; m++) {
    const base = addDaysISO(t, -m * 30);
    add({ categoryId: "c-salary", type: "income", date: addDaysISO(base, -3), amount: 4_800_000, note: "Nómina" });
    add({ categoryId: "c-home", type: "expense", date: addDaysISO(base, -6), amount: 1_150_000, note: "Arriendo" });
    add({ categoryId: "c-subs", type: "expense", date: addDaysISO(base, -9), amount: 39_900, note: "Spotify + Netflix" });
  }
  add({ categoryId: "c-other", type: "income", date: addDaysISO(t, -12), amount: 650_000, note: "Freelance" });

  // Próximos
  const planned: [string, string, number, number, Transaction["recurrence"]][] = [
    ["c-home", "Arriendo", 1_150_000, 4, "monthly"],
    ["c-subs", "Netflix", 29_900, 1, "monthly"],
    ["c-subs", "Spotify", 16_900, 3, "monthly"],
    ["c-health", "Gimnasio", 95_000, 6, "monthly"],
    ["c-home", "Internet + luz", 210_000, 9, "monthly"],
    ["c-edu", "Curso de inglés", 180_000, 15, "monthly"],
    ["c-shop", "Seguro del carro", 640_000, 24, "yearly"],
  ];
  for (const [categoryId, note, amount, ahead, recurrence] of planned) {
    add({ categoryId, note, amount, type: "expense", date: addDaysISO(t, ahead), status: "planned", recurrence });
  }
  return { categories: DEFAULT_CATEGORIES, transactions: txs, settings: { currency: "COP", displayName: "Trader" } };
}
