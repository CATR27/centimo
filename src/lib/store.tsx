"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { localRepo } from "./data/local-repo";
import { supabaseRepo } from "./data/supabase-repo";
import type { Repo } from "./data/repo";
import { setPrivacy } from "./money";
import { isDemo } from "./supabase/env";
import { nextOccurrence } from "./dates";
import { uid } from "./utils";
import type { Category, Settings, Snapshot, Transaction } from "./types";

interface Store extends Snapshot {
  ready: boolean;
  demo: boolean;
  addTx: (t: Omit<Transaction, "id"> & { id?: string }) => void;
  updateTx: (t: Transaction) => void;
  removeTx: (id: string) => void;
  /** Marca un próximo como pagado; si es recurrente, programa el siguiente. */
  markPaid: (id: string) => void;
  saveCategory: (c: Omit<Category, "id"> & { id?: string }) => void;
  removeCategory: (id: string) => void;
  updateSettings: (s: Partial<Settings>) => void;
  reload: () => void;
  /** Modo privado: oculta los montos en toda la app. */
  privacy: boolean;
  togglePrivacy: () => void;
}

const EMPTY: Snapshot = { categories: [], transactions: [], settings: { currency: "COP", displayName: "" } };
const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const repo: Repo = isDemo ? localRepo : supabaseRepo;
  const [snap, setSnap] = useState<Snapshot>(EMPTY);
  const [ready, setReady] = useState(false);
  const [privacy, setPrivacyState] = useState(false);
  setPrivacy(privacy); // antes de renderizar a los hijos
  const snapRef = useRef(snap);
  snapRef.current = snap;

  const reload = useCallback(() => {
    repo.load().then((s) => { setSnap(s); setReady(true); })
      .catch((e: Error) => { toast.error("No se pudieron cargar los datos", { description: e.message }); setReady(true); });
  }, [repo]);

  useEffect(reload, [reload]);
  useEffect(() => {
    try { setPrivacyState(localStorage.getItem("centimo:privacy") === "1"); } catch {}
  }, []);
  const togglePrivacy = useCallback(() => {
    setPrivacyState((v) => {
      try { localStorage.setItem("centimo:privacy", v ? "0" : "1"); } catch {}
      return !v;
    });
  }, []);

  /** Aplica el cambio local al instante y revierte si el servidor falla. */
  const mutate = useCallback((next: (s: Snapshot) => Snapshot, persist: () => Promise<void>) => {
    const before = snapRef.current;
    setSnap(next(before));
    persist().catch((e: Error) => {
      setSnap(before);
      toast.error("No se pudo guardar", { description: e.message });
    });
  }, []);

  const value = useMemo<Store>(() => {
    const upsert = <T extends { id: string }>(list: T[], item: T) =>
      list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [item, ...list];

    return {
      ...snap, ready, demo: isDemo, reload, privacy, togglePrivacy,
      addTx: (t) => {
        const tx: Transaction = { ...t, id: t.id ?? uid() };
        mutate((s) => ({ ...s, transactions: upsert(s.transactions, tx) }), () => repo.saveTx(tx));
      },
      updateTx: (tx) => mutate((s) => ({ ...s, transactions: upsert(s.transactions, tx) }), () => repo.saveTx(tx)),
      removeTx: (id) => mutate((s) => ({ ...s, transactions: s.transactions.filter((t) => t.id !== id) }), () => repo.deleteTx(id)),
      markPaid: (id) => {
        const tx = snapRef.current.transactions.find((t) => t.id === id);
        if (!tx) return;
        const paidTx: Transaction = { ...tx, status: "paid" };
        const follow: Transaction | null = tx.recurrence
          ? { ...tx, id: uid(), date: nextOccurrence(tx.date, tx.recurrence), status: "planned" }
          : null;
        mutate(
          (s) => ({ ...s, transactions: follow ? upsert(upsert(s.transactions, paidTx), follow) : upsert(s.transactions, paidTx) }),
          async () => { await repo.saveTx(paidTx); if (follow) await repo.saveTx(follow); },
        );
        toast.success("Marcado como pagado");
      },
      saveCategory: (c) => {
        const cat: Category = { ...c, id: c.id ?? uid() };
        mutate((s) => ({ ...s, categories: upsert(s.categories, cat) }), () => repo.saveCategory(cat));
      },
      removeCategory: (id) =>
        mutate(
          (s) => ({
            ...s,
            categories: s.categories.filter((c) => c.id !== id),
            transactions: s.transactions.map((t) => (t.categoryId === id ? { ...t, categoryId: null } : t)),
          }),
          () => repo.deleteCategory(id),
        ),
      updateSettings: (patch) => {
        const settings = { ...snapRef.current.settings, ...patch };
        mutate((s) => ({ ...s, settings }), () => repo.saveSettings(settings));
      },
    };
  }, [snap, ready, mutate, repo, reload, privacy, togglePrivacy]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore fuera de StoreProvider");
  return v;
}
