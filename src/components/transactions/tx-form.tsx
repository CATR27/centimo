"use client";

import { Check, Delete, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CategoryIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { addDaysISO, today } from "@/lib/dates";
import { currencyInfo, currencySymbol, toMajor, toMinor } from "@/lib/money";
import { useStore } from "@/lib/store";
import { NEON_COLORS, type Recurrence, type Transaction, type TxStatus, type TxType } from "@/lib/types";
import { cn, uid } from "@/lib/utils";
import type { OpenOpts } from "./quick-add";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "del"] as const;
const REC: { v: Recurrence; label: string }[] = [
  { v: null, label: "Una vez" }, { v: "weekly", label: "Semanal" },
  { v: "monthly", label: "Mensual" }, { v: "yearly", label: "Anual" },
];

export function TxFormSheet({ open, opts, onClose }: { open: boolean; opts: OpenOpts; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title={opts.tx ? "Editar movimiento" : "Nuevo movimiento"}>
      {/* Se remonta en cada apertura para reiniciar el estado del formulario. */}
      {open && <Form opts={opts} onClose={onClose} />}
    </Sheet>
  );
}

function Form({ opts, onClose }: { opts: OpenOpts; onClose: () => void }) {
  const { categories, settings, addTx, updateTx, removeTx, saveCategory } = useStore();
  const cur = settings.currency;
  const decimals = currencyInfo(cur).decimals;
  const editing = opts.tx;

  const [type, setType] = useState<TxType>(editing?.type ?? opts.type ?? "expense");
  const [raw, setRaw] = useState(editing ? String(toMajor(editing.amount, cur)) : "");
  const [categoryId, setCategoryId] = useState<string | null>(editing?.categoryId ?? null);
  const [note, setNote] = useState(editing?.note ?? "");
  const [date, setDate] = useState(editing?.date ?? addDaysISO(today(), opts.status === "planned" ? 1 : 0));
  const [status, setStatus] = useState<TxStatus>(editing?.status ?? opts.status ?? "paid");
  const [rec, setRec] = useState<Recurrence>(editing?.recurrence ?? null);

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<string>(NEON_COLORS[0]);

  const cats = useMemo(() => categories.filter((c) => c.kind === type), [categories, type]);
  useEffect(() => {
    if (categoryId && !cats.some((c) => c.id === categoryId)) setCategoryId(null);
  }, [cats, categoryId]);

  const press = (k: (typeof KEYS)[number]) => {
    setRaw((v) => {
      if (k === "del") return v.slice(0, -1);
      if (k === ".") return decimals === 0 || v.includes(".") ? v : (v || "0") + ".";
      const [, frac = ""] = v.split(".");
      if (v.includes(".") && frac.length >= decimals) return v;
      if (v === "0") return k;
      return v.length >= 12 ? v : v + k;
    });
  };

  function createCategory() {
    const name = newName.trim();
    if (!name) return;
    const id = uid();
    saveCategory({ id, name, kind: type, icon: "tag", color: newColor, monthlyBudget: null });
    setCategoryId(id);
    setNewName("");
    setCreating(false);
  }

  const amount = toMinor(Number(raw || 0), cur);
  const valid = amount > 0 && !!date;
  const shown = raw ? Number(raw.replace(/\.$/, "")).toLocaleString("es", { maximumFractionDigits: decimals }) + (raw.endsWith(".") ? "." : "") : "0";

  function submit() {
    if (!valid) return;
    const base = { categoryId, amount, type, note: note.trim(), date, status, recurrence: status === "planned" || rec ? rec : null };
    if (editing) updateTx({ ...editing, ...base } as Transaction);
    else addTx(base);
    onClose();
  }

  return (
    <div className="space-y-4 pb-2">
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1" role="radiogroup" aria-label="Tipo">
        {(["expense", "income"] as const).map((t) => (
          <button
            key={t} role="radio" aria-checked={type === t} onClick={() => setType(t)}
            className={cn("h-10 rounded-lg text-sm font-medium transition",
              type === t ? (t === "expense" ? "bg-neg/15 text-neg" : "bg-pos/15 text-pos") : "text-muted")}
          >
            {t === "expense" ? "Gasto" : "Ingreso"}
          </button>
        ))}
      </div>

      <div className="py-1 text-center" aria-live="polite">
        <div className={cn("num flex items-baseline justify-center gap-1.5 text-5xl font-semibold", type === "expense" ? "text-neg" : "text-pos", "glow-text")}>
          <span className="text-2xl opacity-70">{currencySymbol(cur)}</span>
          <span className={cn(!raw && "opacity-30")}>{shown}</span>
        </div>
      </div>

      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 no-scrollbar" role="radiogroup" aria-label="Categoría">
        <button
          onClick={() => setCreating((v) => !v)} aria-expanded={creating}
          className={cn("flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-dashed px-3 text-sm transition",
            creating ? "border-accent text-accent" : "border-line text-accent")}
        >
          <Plus className="size-4" /> Nueva
        </button>
        {cats.map((c) => {
          const on = categoryId === c.id;
          return (
            <button
              key={c.id} role="radio" aria-checked={on} onClick={() => setCategoryId(on ? null : c.id)}
              className={cn("flex h-11 shrink-0 items-center gap-2 rounded-xl border px-3 text-sm transition", on ? "text-ink" : "border-line text-muted")}
              style={on ? { borderColor: c.color, background: `color-mix(in srgb, ${c.color} 16%, transparent)` } : undefined}
            >
              <CategoryIcon name={c.icon} className="size-4" />
              <span>{c.name}</span>
            </button>
          );
        })}
      </div>

      {creating && (
        <div className="space-y-3 rounded-xl border border-line bg-surface-2 p-3">
          <div className="flex gap-2">
            <input
              value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={40} autoFocus
              onKeyDown={(e) => e.key === "Enter" && createCategory()}
              placeholder={type === "expense" ? "Nombre (ej. Mascotas)" : "Nombre (ej. Ventas)"}
              className="h-11 min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 text-base outline-none focus:border-accent"
            />
            <button
              onClick={createCategory} disabled={!newName.trim()} aria-label="Crear categoría"
              className="grid size-11 shrink-0 place-items-center rounded-lg bg-accent text-accent-ink disabled:opacity-40"
            >
              <Check className="size-5" />
            </button>
          </div>
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1" role="radiogroup" aria-label="Color">
            {NEON_COLORS.map((c) => (
              <button
                key={c} role="radio" aria-checked={newColor === c} aria-label={`Color ${c}`} onClick={() => setNewColor(c)}
                className={cn("size-8 shrink-0 rounded-full ring-offset-2 ring-offset-surface-2 transition", newColor === c && "ring-2")}
                style={{ background: c, boxShadow: `0 0 10px ${c}88`, ["--tw-ring-color" as string]: c }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {KEYS.map((k) => (
          <button
            key={k} onClick={() => press(k)} aria-label={k === "del" ? "Borrar" : k}
            disabled={k === "." && decimals === 0}
            className="num grid h-14 place-items-center rounded-xl bg-surface-2 text-2xl font-medium active:scale-95 active:bg-line disabled:opacity-20"
          >
            {k === "del" ? <Delete className="size-6" /> : k}
          </button>
        ))}
      </div>

      <input
        value={note} onChange={(e) => setNote(e.target.value)} maxLength={80} placeholder="Nota (opcional)"
        className="h-12 w-full rounded-xl border border-line bg-surface-2 px-3.5 text-base outline-none focus:border-accent"
      />

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-xs text-muted">Fecha</span>
          <input
            type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="h-12 w-full rounded-xl border border-line bg-surface-2 px-3 text-base outline-none focus:border-accent"
          />
        </label>
        <div>
          <span className="mb-1 block text-xs text-muted">Estado</span>
          <div className="grid h-12 grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1">
            {(["paid", "planned"] as const).map((s) => (
              <button key={s} onClick={() => setStatus(s)} aria-pressed={status === s}
                className={cn("rounded-lg text-sm font-medium", status === s ? "bg-surface text-accent" : "text-muted")}>
                {s === "paid" ? "Hecho" : "Próximo"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {status === "planned" && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar" role="radiogroup" aria-label="Repetición">
          {REC.map((r) => (
            <button key={r.label} role="radio" aria-checked={rec === r.v} onClick={() => setRec(r.v)}
              className={cn("num h-9 shrink-0 rounded-lg border px-3.5 text-xs", rec === r.v ? "border-accent/60 bg-accent/15 text-accent" : "border-line text-muted")}>
              {r.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        {editing && (
          <Button variant="danger" size="icon" aria-label="Eliminar" onClick={() => { removeTx(editing.id); onClose(); }}>
            <Trash2 className="size-5" />
          </Button>
        )}
        <Button size="lg" className="flex-1" disabled={!valid} onClick={submit}>
          {editing ? "Guardar cambios" : status === "planned" ? "Programar" : type === "income" ? "Registrar ingreso" : "Registrar gasto"}
        </Button>
      </div>
    </div>
  );
}
