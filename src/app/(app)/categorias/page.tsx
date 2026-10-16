"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { CategoryIcon, ICONS } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { currencySymbol, toMajor, toMinor } from "@/lib/money";
import { useStore } from "@/lib/store";
import { NEON_COLORS, type Category, type TxType } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function Categorias() {
  const { categories, settings } = useStore();
  const [edit, setEdit] = useState<Partial<Category> | null>(null);

  return (
    <div>
      <PageHeader title="Categorías" sub="Colores, iconos y presupuestos"
        right={<Button onClick={() => setEdit({ kind: "expense", icon: "tag", color: NEON_COLORS[0], monthlyBudget: null })}><Plus className="size-4" /> Nueva</Button>} />
      {(["expense", "income"] as const).map((kind) => (
        <section key={kind} className="mb-6">
          <h2 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{kind === "expense" ? "Gastos" : "Ingresos"}</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {categories.filter((c) => c.kind === kind).map((c) => (
              <button key={c.id} onClick={() => setEdit(c)}
                className="flex min-h-16 items-center gap-3 rounded-2xl border border-line bg-surface p-3 text-left active:bg-surface-2">
                <span className="grid size-11 place-items-center rounded-xl" style={{ background: `color-mix(in srgb, ${c.color} 16%, transparent)`, color: c.color }}>
                  <CategoryIcon name={c.icon} className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{c.name}</span>
                  <span className="num block text-xs text-muted">
                    {c.monthlyBudget ? `Presupuesto ${currencySymbol(settings.currency)}${toMajor(c.monthlyBudget, settings.currency).toLocaleString("es")}` : "Sin presupuesto"}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}
      <Sheet open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? "Editar categoría" : "Nueva categoría"}>
        {edit && <CatForm key={edit.id ?? "new"} initial={edit} onClose={() => setEdit(null)} />}
      </Sheet>
    </div>
  );
}

function CatForm({ initial, onClose }: { initial: Partial<Category>; onClose: () => void }) {
  const { saveCategory, removeCategory, settings } = useStore();
  const cur = settings.currency;
  const [name, setName] = useState(initial.name ?? "");
  const [kind, setKind] = useState<TxType>(initial.kind ?? "expense");
  const [icon, setIcon] = useState(initial.icon ?? "tag");
  const [color, setColor] = useState(initial.color ?? NEON_COLORS[0]);
  const [budget, setBudget] = useState(initial.monthlyBudget ? String(toMajor(initial.monthlyBudget, cur)) : "");

  const save = () => {
    if (!name.trim()) return;
    saveCategory({
      id: initial.id, name: name.trim(), kind, icon, color,
      monthlyBudget: kind === "expense" && Number(budget) > 0 ? toMinor(Number(budget), cur) : null,
    });
    onClose();
  };

  return (
    <div className="space-y-4 pb-2">
      <Field label="Nombre"><Input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Ej. Mascotas" autoFocus={!initial.id} /></Field>
      {!initial.id && (
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1">
          {(["expense", "income"] as const).map((k) => (
            <button key={k} onClick={() => setKind(k)} aria-pressed={kind === k}
              className={cn("h-10 rounded-lg text-sm font-medium", kind === k ? "bg-surface text-accent" : "text-muted")}>
              {k === "expense" ? "Gasto" : "Ingreso"}
            </button>
          ))}
        </div>
      )}
      <div>
        <span className="mb-2 block text-xs font-medium text-muted">Color</span>
        <div className="flex flex-wrap gap-2.5">
          {NEON_COLORS.map((c) => (
            <button key={c} onClick={() => setColor(c)} aria-label={`Color ${c}`} aria-pressed={color === c}
              className={cn("size-10 rounded-full ring-offset-2 ring-offset-surface transition", color === c && "ring-2")}
              style={{ background: c, ["--tw-ring-color" as string]: c }} />
          ))}
        </div>
      </div>
      <div>
        <span className="mb-2 block text-xs font-medium text-muted">Icono</span>
        <div className="grid grid-cols-5 gap-2">
          {Object.keys(ICONS).map((k) => (
            <button key={k} onClick={() => setIcon(k)} aria-label={k} aria-pressed={icon === k}
              className={cn("grid h-12 place-items-center rounded-xl border", icon === k ? "text-ink" : "border-line text-muted")}
              style={icon === k ? { borderColor: color, background: `color-mix(in srgb, ${color} 16%, transparent)`, color } : undefined}>
              <CategoryIcon name={k} className="size-5" />
            </button>
          ))}
        </div>
      </div>
      {kind === "expense" && (
        <Field label={`Presupuesto mensual (${currencySymbol(cur)})`}>
          <Input value={budget} onChange={(e) => setBudget(e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" placeholder="Sin límite" />
        </Field>
      )}
      <div className="flex gap-2 pt-1">
        {initial.id && (
          <Button variant="danger" size="icon" aria-label="Eliminar categoría"
            onClick={() => { if (confirm("¿Eliminar categoría? Sus movimientos quedarán sin categoría.")) { removeCategory(initial.id!); onClose(); } }}>
            <Trash2 className="size-5" />
          </Button>
        )}
        <Button size="lg" className="flex-1" disabled={!name.trim()} onClick={save}>Guardar</Button>
      </div>
    </div>
  );
}
