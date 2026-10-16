"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { Transaction, TxStatus, TxType } from "@/lib/types";
import { TxFormSheet } from "./tx-form";

export interface OpenOpts { tx?: Transaction; type?: TxType; status?: TxStatus }
const Ctx = createContext<(o?: OpenOpts) => void>(() => {});
export const useQuickAdd = () => useContext(Ctx);

export function QuickAddProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ open: boolean; opts: OpenOpts }>({ open: false, opts: {} });
  const open = useCallback((o: OpenOpts = {}) => setState({ open: true, opts: o }), []);
  const close = useCallback(() => setState((s) => ({ ...s, open: false })), []);
  return (
    <Ctx.Provider value={open}>
      {children}
      <TxFormSheet open={state.open} opts={state.opts} onClose={close} />
    </Ctx.Provider>
  );
}
