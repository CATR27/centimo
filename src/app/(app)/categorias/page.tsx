"use client";

import { Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { AnimatedIcon } from "@/components/animated-icon";
import { HeroBanner } from "@/components/design";
import { CategoryIcon, ICON_NAMES } from "@/components/icons";
import { PageHeader, RoundAction } from "@/components/page-header";
import { Segmented } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { byCategory } from "@/lib/analytics";
import { periodRanges } from "@/lib/dates";
import { currencySymbol, formatMoney, toMajor, toMinor } from "@/lib/money";
import { useStore } from "@/lib/store";
import { NEON_COLORS, type Category, type TxType } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function Categorias() {
  const { categories, transactions, settings } = useStore();
  const [edit, setEdit] = useState<Partial<Category> | null>(null);
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const cur = settings.currency;

  const list = useMemo(() => {
    const month = periodRanges("MES").current;
    const spent = new Map(byCategory(transactions, categories, month, kind).map((s) => [s.id, s.value]));
    return categories.filter((c) => c.kind === kind).map((c) => {
      const v = spent.get(c.id) ?? 0;
      const b = c.monthlyBudget ?? 0;
      const pct = b ? v / b : v ? 1 : 0;
      return { c, v, b, pct, over: !!b && v > b };
    });
  }, [categories, transactions, kind]);
  const budgeted = list.filter((x) => x.b).length;
  const exceeded = list.filter((x) => x.over).length;
  const top = [...list].sort((x, y) => y.v - x.v)[0];

  return (
    <div className="space-y-3.5">
      <PageHeader title="Categorías"
        right={<RoundAction aria-label="Nueva categoría" onClick={() => setEdit({ kind, icon: "tag", color: NEON_COLORS[0], monthlyBudget: null })}><AnimatedIcon name="mas" className="size-[21px]" /></RoundAction>} />
      <Segmented value={kind} onChange={setKind} options={[{ value: "expense", label: "Gastos" }, { value: "income", label: "Ingresos" }]} />

      <HeroBanner tone="lime" avatar={12}>
        <span className="text-2xl font-semibold leading-[1.05]">{kind === "expense" ? `${list.length} categorías de gasto` : `${list.length} fuentes de ingreso`}</span>
        <span className="muted-ink text-[13px]">
          {kind === "expense" ? `${budgeted} con presupuesto · ${exceeded} excedido${exceeded === 1 ? "" : "s"}` : top?.v ? `${top.c.name} es tu mayor fuente` : "Aún sin ingresos este mes"}
        </span>
        <button onClick={() => setEdit({ kind, icon: "tag", color: NEON_COLORS[0], monthlyBudget: null })}
          className="mt-2.5 flex h-[42px] items-center gap-2 self-start whitespace-nowrap rounded-full bg-accent pl-1.5 pr-4 text-sm font-semibold text-accent-ink transition active:scale-95">
          <span className="grid size-[30px] place-items-center rounded-full bg-lime text-lime-ink"><AnimatedIcon name="mas" strokeWidth={2.4} className="size-[15px]" idle={false} /></span>Nueva
        </button>
      </HeroBanner>

      <div className="grid grid-cols-3 gap-x-1 gap-y-[18px] rounded-[30px] bg-surface px-2.5 py-[18px] sm:grid-cols-4 lg:grid-cols-6">
        {list.map(({ c, v, b, pct, over }) => (
          <button key={c.id} onClick={() => setEdit(c)} className="flex flex-col items-center gap-1.5 text-center transition active:scale-95">
            <span className="grid size-[82px] place-items-center rounded-full"
              style={{ background: `conic-gradient(${over ? "#d6456f" : c.color} ${Math.round(Math.min(pct, 1) * 360)}deg, var(--border) 0)` }}>
              <span className="grid size-[66px] place-items-center rounded-full bg-surface"><CategoryIcon name={c.icon} className="size-6" idle /></span>
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">{c.name}</span>
              <span className={cn("num whitespace-nowrap text-xs", over ? "text-neg" : "text-muted")}>
                {b ? `${Math.round(pct * 100)}% usado` : v ? formatMoney(v, cur) : "Sin movimientos"}
              </span>
            </span>
          </button>
        ))}
      </div>

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
        <div className="grid grid-cols-2 gap-1 rounded-full bg-surface-2 p-1">
          {(["expense", "income"] as const).map((k) => (
            <button key={k} onClick={() => setKind(k)} aria-pressed={kind === k}
              className={cn("h-10 rounded-full text-sm font-semibold", kind === k ? "bg-accent text-accent-ink" : "text-muted")}>
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
          {ICON_NAMES.map((k) => (
            <button key={k} onClick={() => setIcon(k)} aria-label={k} aria-pressed={icon === k}
              className={cn("grid h-12 place-items-center rounded-full border", icon === k ? "text-ink" : "border-line text-muted")}
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
