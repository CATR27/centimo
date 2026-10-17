"use client";

import { Check, Delete, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { HScroll } from "@/components/ui/hscroll";
import { Sheet } from "@/components/ui/sheet";
import { addDaysISO, today } from "@/lib/dates";
import { currencyInfo, currencySymbol, toMajor, toMinor } from "@/lib/money";
import { parseTags } from "@/lib/accounts";
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
    <Sheet open={open} onClose={onClose} title={opts.tx ? "Editar movimiento" : "Nuevo movimiento"} subtitle={opts.tx ? undefined : "· monto"}>
      {/* Se remonta en cada apertura para reiniciar el estado del formulario. */}
      {open && <Form opts={opts} onClose={onClose} />}
    </Sheet>
  );
}

function Form({ opts, onClose }: { opts: OpenOpts; onClose: () => void }) {
  const { categories, accounts, settings, addTx, updateTx, removeTx, saveCategory } = useStore();
  const cur = settings.currency;
  const decimals = currencyInfo(cur).decimals;
  const editing = opts.tx;

  const [type, setType] = useState<TxType>(editing?.type ?? opts.type ?? "expense");
  const [raw, setRaw] = useState(editing ? String(toMajor(editing.amount, cur)) : "");
  const [categoryId, setCategoryId] = useState<string | null>(editing?.categoryId ?? null);
  const [note, setNote] = useState(editing?.note ?? "");
  const [date, setDate] = useState(editing?.date ?? opts.date ?? addDaysISO(today(), opts.status === "planned" ? 1 : 0));
  const [status, setStatus] = useState<TxStatus>(editing?.status ?? opts.status ?? (opts.date && opts.date > today() ? "planned" : "paid"));
  const [rec, setRec] = useState<Recurrence>(editing?.recurrence ?? null);

  const [accountId, setAccountId] = useState<string | null>(editing?.accountId ?? accounts[0]?.id ?? null);
  const [tagsText, setTagsText] = useState((editing?.tags ?? []).map((t) => `#${t}`).join(" "));

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
  const [intPart, fracPart] = raw.split(".");
  const grouped = (intPart || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const shown = raw ? grouped + (fracPart !== undefined ? "," + fracPart : "") : "0";

  function submit() {
    if (!valid) return;
    const base = {
      categoryId, amount, type, note: note.trim(), date, status, recurrence: status === "planned" || rec ? rec : null,
      accountId, tags: parseTags(tagsText),
    };
    if (editing) updateTx({ ...editing, ...base } as Transaction);
    else addTx(base);
    onClose();
  }

  // Teclado físico: dígitos, punto/coma, Backspace y Enter (si no se está escribiendo en un campo).
  const keys = useRef({ press, submit, valid });
  keys.current = { press, submit, valid };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement | null)?.closest("input, textarea, select, [contenteditable]")) return;
      const k = keys.current;
      if (/^[0-9]$/.test(e.key)) k.press(e.key as (typeof KEYS)[number]);
      else if (e.key === "." || e.key === ",") k.press(".");
      else if (e.key === "Backspace") k.press("del");
      else if (e.key === "Enter" && k.valid) k.submit();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const selected = cats.find((c) => c.id === categoryId);
  const isExp = type === "expense";

  return (
    <div className="space-y-4 pb-3">
      {/* Tipo */}
      <div className="grid grid-cols-2 gap-1 rounded-full bg-surface-2 p-1" role="radiogroup" aria-label="Tipo">
        {(["expense", "income"] as const).map((t) => (
          <button
            key={t} role="radio" aria-checked={type === t} onClick={() => setType(t)}
            className={cn("h-11 rounded-full text-sm font-semibold transition", type === t ? "bg-accent text-accent-ink" : "text-muted")}
          >
            {t === "expense" ? "Gasto" : "Ingreso"}
          </button>
        ))}
      </div>

      {/* Tarjeta de monto (degradado) */}
      <div className="grad-card rounded-[28px] p-5" aria-live="polite">
        <div className="flex items-center justify-between text-xs">
          <span className="muted-ink font-medium">{isExp ? "Gastaste" : "Recibiste"}</span>
          <span className="rounded-full bg-black/10 px-3 py-1 font-semibold">{cur}</span>
        </div>
        <div className="num mt-3 flex items-end justify-between gap-3">
          <div className="flex min-w-0 items-baseline gap-1.5">
            <span className="text-2xl font-medium opacity-60">{currencySymbol(cur)}</span>
            <span className={cn("truncate text-[2.75rem] font-semibold leading-none sm:text-5xl", !raw && "opacity-35")}>{shown}</span>
            <span className="caret mb-1 h-9 w-[2px] shrink-0 bg-black/70" />
          </div>
        </div>
        <div className="mt-4 border-t border-dashed border-black/25 pt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="muted-ink">Categoría</span>
            <span className="num text-sm font-semibold">{selected?.name ?? "Sin categoría"}</span>
          </div>
        </div>
      </div>

      {/* Categorías */}
      <div className="flex max-h-[7.5rem] flex-wrap gap-2 overflow-y-auto overscroll-contain" role="radiogroup" aria-label="Categoría">
        <button
          onClick={() => setCreating((v) => !v)} aria-expanded={creating}
          className={cn("flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-dashed px-4 text-[13px] font-semibold transition",
            creating ? "border-ink bg-surface text-ink" : "border-muted/50 text-ink")}
        >
          <Plus className="size-4" /> Nueva
        </button>
        {cats.map((c) => {
          const on = categoryId === c.id;
          return (
            <button
              key={c.id} role="radio" aria-checked={on} onClick={() => setCategoryId(on ? null : c.id)}
              className={cn("flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[13px] font-semibold transition",
                on ? "bg-accent text-accent-ink" : "bg-surface-2 text-ink/70")}
            >
              <span className="size-2 rounded-full" style={{ background: c.color }} />
              {c.name}
            </button>
          );
        })}
      </div>

      {creating && (
        <div className="space-y-3 rounded-[24px] bg-surface p-3">
          <div className="flex gap-2">
            <input
              value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={40} autoFocus
              onKeyDown={(e) => e.key === "Enter" && createCategory()}
              placeholder={isExp ? "Nombre (ej. Mascotas)" : "Nombre (ej. Ventas)"}
              className="h-11 min-w-0 flex-1 rounded-full bg-surface-2 px-4 text-base outline-none"
            />
            <button
              onClick={createCategory} disabled={!newName.trim()} aria-label="Crear categoría"
              className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-accent-ink disabled:opacity-40"
            >
              <Check className="size-5" />
            </button>
          </div>
          <HScroll className="flex gap-2.5 py-1" role="radiogroup" aria-label="Color">
            {NEON_COLORS.map((c) => (
              <button
                key={c} role="radio" aria-checked={newColor === c} aria-label={`Color ${c}`} onClick={() => setNewColor(c)}
                className={cn("size-8 shrink-0 rounded-full ring-offset-2 ring-offset-surface transition", newColor === c && "ring-2")}
                style={{ background: c, ["--tw-ring-color" as string]: c }}
              />
            ))}
          </HScroll>
        </div>
      )}

      {/* Teclado */}
      <div className="keypad grid grid-cols-3 gap-y-1 border-t border-line pt-3">
        {KEYS.map((k) => (
          <button
            key={k} onClick={() => press(k)} aria-label={k === "del" ? "Borrar" : k === "." ? "Coma decimal" : k}
            disabled={k === "." && decimals === 0}
            className="num grid h-[3.75rem] place-items-center text-[2rem] font-light text-ink/45 hover:text-ink active:text-ink disabled:opacity-20"
          >
            {k === "del" ? <Delete className="size-7" strokeWidth={1.5} /> : k === "." ? "," : k}
          </button>
        ))}
      </div>

      {accounts.length > 0 && (
        <div role="radiogroup" aria-label="Cuenta">
          <span className="mb-1 block px-1 text-xs text-muted">Cuenta</span>
          <HScroll className="flex gap-2">
            {accounts.map((a) => {
              const on = accountId === a.id;
              return (
                <button key={a.id} role="radio" aria-checked={on} onClick={() => setAccountId(a.id)}
                  className={cn("flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[13px] font-semibold transition", on ? "bg-accent text-accent-ink" : "bg-surface-2 text-ink/70")}>
                  <span className="size-2 rounded-full" style={{ background: a.color }} />{a.name}
                </button>
              );
            })}
          </HScroll>
        </div>
      )}

      <input
        value={note} onChange={(e) => setNote(e.target.value)} maxLength={80} placeholder="Nota (opcional)"
        className="h-13 min-h-[3.25rem] w-full rounded-full bg-surface px-4 text-base outline-none placeholder:text-muted/80 focus:ring-2 focus:ring-ink/20"
      />

      <input
        value={tagsText} onChange={(e) => setTagsText(e.target.value)} maxLength={80} placeholder="Etiquetas: #viaje #trabajo"
        aria-label="Etiquetas"
        className="h-13 min-h-[3.25rem] w-full rounded-full bg-surface px-4 text-base outline-none placeholder:text-muted/80 focus:ring-2 focus:ring-ink/20"
      />

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block px-1 text-xs text-muted">Fecha</span>
          <input
            type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="h-13 min-h-[3.25rem] w-full rounded-full bg-surface px-3 text-base outline-none focus:ring-2 focus:ring-ink/20"
          />
        </label>
        <div>
          <span className="mb-1 block px-1 text-xs text-muted">Estado</span>
          <div className="grid h-[3.25rem] grid-cols-2 gap-1 rounded-full bg-surface p-1">
            {(["paid", "planned"] as const).map((s) => (
              <button key={s} onClick={() => setStatus(s)} aria-pressed={status === s}
                className={cn("rounded-full text-sm font-semibold", status === s ? "bg-accent text-accent-ink" : "text-muted")}>
                {s === "paid" ? "Hecho" : "Próximo"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {status === "planned" && (
        <HScroll className="flex gap-2" role="radiogroup" aria-label="Repetición">
          {REC.map((r) => (
            <button key={r.label} role="radio" aria-checked={rec === r.v} onClick={() => setRec(r.v)}
              className={cn("h-10 shrink-0 rounded-full px-4 text-[13px] font-semibold", rec === r.v ? "bg-accent text-accent-ink" : "bg-surface-2 text-muted")}>
              {r.label}
            </button>
          ))}
        </HScroll>
      )}

      <div className="flex gap-2 pt-1">
        {editing && (
          <Button variant="danger" size="icon" className="size-14" aria-label="Eliminar" onClick={() => { removeTx(editing.id); onClose(); }}>
            <Trash2 className="size-5" />
          </Button>
        )}
        <Button size="lg" className="flex-1" disabled={!valid} onClick={submit}>
          {editing ? "Guardar cambios" : status === "planned" ? "Programar" : isExp ? `Registrar gasto${valid ? " " + shown : ""}` : `Registrar ingreso${valid ? " " + shown : ""}`}
        </Button>
      </div>
    </div>
  );
}
