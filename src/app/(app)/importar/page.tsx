"use client";

import { FileUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, SectionTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { dupKey, buildItems, detectDayFirst, guessColumns, parseCsv, type ColumnMap } from "@/lib/csv-import";
import { fmtDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const FIELDS: { key: keyof ColumnMap; label: string; hint?: string }[] = [
  { key: "date", label: "Fecha" },
  { key: "amount", label: "Monto", hint: "o usa Débito/Crédito" },
  { key: "note", label: "Descripción" },
  { key: "type", label: "Tipo (opcional)" },
  { key: "category", label: "Categoría (opcional)" },
  { key: "debit", label: "Débito (opcional)" },
  { key: "credit", label: "Crédito (opcional)" },
];

export default function Importar() {
  const { accounts, categories, transactions, settings, addMany } = useStore();
  const router = useRouter();
  const cur = settings.currency;

  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [hasHeader, setHasHeader] = useState(true);
  const [map, setMap] = useState<ColumnMap | null>(null);
  const [dayFirst, setDayFirst] = useState<boolean | null>(null);
  const [invert, setInvert] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);

  const parsed = useMemo(() => (text.trim() ? parseCsv(text) : null), [text]);
  const header = useMemo(
    () => (parsed ? (hasHeader ? parsed.rows[0] : parsed.rows[0].map((_, i) => `Columna ${i + 1}`)) : []),
    [parsed, hasHeader],
  );
  const body = useMemo(() => (parsed ? (hasHeader ? parsed.rows.slice(1) : parsed.rows) : []), [parsed, hasHeader]);
  const cols = map ?? (parsed ? guessColumns(header) : null);
  const effDayFirst = dayFirst ?? (cols && cols.date >= 0 ? detectDayFirst(body.map((r) => r[cols.date] ?? "")) : true);
  const acc = accountId ?? accounts[0]?.id ?? null;

  const result = useMemo(() => {
    if (!cols || cols.date < 0 || (cols.amount < 0 && cols.debit < 0 && cols.credit < 0)) return null;
    const { items, errors } = buildItems(body, cols, { dayFirst: effDayFirst, invertSign: invert, currency: cur, categories }, hasHeader ? 2 : 1);
    const seen = new Set(transactions.map((t) => dupKey(t)));
    const fresh = items.filter((i) => !seen.has(dupKey(i)));
    return { items: fresh, errors, dups: items.length - fresh.length };
  }, [body, cols, effDayFirst, invert, cur, categories, transactions, hasHeader]);

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5_000_000) { toast.error("El archivo supera 5 MB"); return; }
    setFileName(f.name);
    f.text().then((t) => { setText(t); setMap(null); setDayFirst(null); });
  }

  function doImport() {
    if (!result?.items.length) return;
    const n = addMany(result.items.map((i) => ({
      categoryId: i.categoryId, amount: i.amount, type: i.type, note: i.note, date: i.date,
      status: "paid" as const, recurrence: null, accountId: acc, tags: ["importado"],
    })));
    toast.success(`${n} movimientos importados`);
    router.push("/transacciones");
  }

  const select = (key: keyof ColumnMap, label: string, hint?: string) => (
    <label key={key} className="block">
      <span className="mb-1 block px-1 text-xs text-muted">{label}{hint && <span className="opacity-70"> · {hint}</span>}</span>
      <select value={cols?.[key] ?? -1} onChange={(e) => setMap({ ...(cols as ColumnMap), [key]: Number(e.target.value) })}
        className="h-12 w-full rounded-2xl bg-surface-2 px-3 text-base outline-none focus:ring-2 focus:ring-ink/20">
        <option value={-1}>— ninguna —</option>
        {header.map((h, i) => <option key={i} value={i}>{h || `Columna ${i + 1}`}</option>)}
      </select>
    </label>
  );

  return (
    <div>
      <PageHeader title="Importar" sub="Trae movimientos desde el CSV de tu banco" />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="space-y-6">
          <Card className="rounded-[36px]">
            <SectionTitle>1 · Archivo</SectionTitle>
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-[28px] border-2 border-dashed border-muted/40 px-4 py-8 text-center transition hover:border-ink/50">
              <span className="grid size-12 place-items-center rounded-full bg-accent text-accent-ink"><FileUp className="size-5" /></span>
              <span className="text-sm font-semibold">{fileName || "Elegir archivo .csv"}</span>
              <span className="text-xs text-muted">Separador y formatos de fecha/monto se detectan solos</span>
              <input type="file" accept=".csv,.txt,text/csv" onChange={onFile} className="sr-only" aria-label="Archivo CSV" />
            </label>
            <textarea value={text} onChange={(e) => { setText(e.target.value); setMap(null); setDayFirst(null); }} rows={4}
              placeholder="…o pega aquí el contenido del CSV" aria-label="Contenido CSV"
              className="mt-3 w-full resize-y rounded-2xl bg-surface-2 p-3 font-mono text-xs outline-none focus:ring-2 focus:ring-ink/20" />
          </Card>

          {parsed && cols && (
            <Card className="rounded-[36px]">
              <SectionTitle>2 · Columnas</SectionTitle>
              <p className="mb-3 text-xs text-muted">{body.length} filas · separador «{parsed.delimiter === "\t" ? "tab" : parsed.delimiter}»</p>
              <div className="grid gap-3 sm:grid-cols-2">{FIELDS.map((f) => select(f.key, f.label, f.hint))}</div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Chip active={hasHeader} onClick={() => { setHasHeader((v) => !v); setMap(null); }}>Primera fila = encabezados</Chip>
                <Chip active={effDayFirst} onClick={() => setDayFirst(true)}>Día/Mes/Año</Chip>
                <Chip active={!effDayFirst} onClick={() => setDayFirst(false)}>Mes/Día/Año</Chip>
                <Chip active={invert} onClick={() => setInvert((v) => !v)}>Invertir signo</Chip>
              </div>
              {accounts.length > 0 && (
                <div className="mt-4" role="radiogroup" aria-label="Cuenta destino">
                  <span className="mb-2 block text-xs font-medium text-muted">Importar a la cuenta</span>
                  <div className="flex flex-wrap gap-2">{accounts.map((a) => <Chip key={a.id} active={acc === a.id} onClick={() => setAccountId(a.id)}>{a.name}</Chip>)}</div>
                </div>
              )}
            </Card>
          )}
        </div>

        <Card className="rounded-[36px]">
          <SectionTitle>3 · Vista previa</SectionTitle>
          {!result ? (
            <p className="py-8 text-center text-sm text-muted">{parsed ? "Elige las columnas de fecha y monto para ver la vista previa." : "Carga un archivo para empezar."}</p>
          ) : (
            <>
              <div className="mb-4 grid grid-cols-3 gap-2 text-center">
                <Stat label="A importar" value={result.items.length} good />
                <Stat label="Duplicados" value={result.dups} />
                <Stat label="Con error" value={result.errors.length} bad={result.errors.length > 0} />
              </div>
              <div className="overflow-x-auto rounded-2xl border border-line/70">
                <table className="w-full min-w-[26rem] text-sm">
                  <thead><tr className="bg-surface-2 text-left text-xs text-muted"><th className="px-3 py-2">Fecha</th><th className="px-3 py-2">Descripción</th><th className="px-3 py-2 text-right">Monto</th></tr></thead>
                  <tbody>
                    {result.items.slice(0, 8).map((i) => (
                      <tr key={i.line} className="border-t border-line/60">
                        <td className="num whitespace-nowrap px-3 py-2">{fmtDate(i.date, "d MMM yy")}</td>
                        <td className="max-w-[12rem] truncate px-3 py-2">{i.note || "—"}</td>
                        <td className={cn("num whitespace-nowrap px-3 py-2 text-right font-semibold", i.type === "income" && "text-pos")}>{i.type === "income" ? "+" : "−"}{formatMoney(i.amount, cur)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {result.errors.length > 0 && (
                <p className="mt-3 text-xs text-neg">Filas omitidas: {result.errors.slice(0, 4).map((e) => `#${e.line} (${e.reason})`).join(", ")}{result.errors.length > 4 ? "…" : ""}</p>
              )}
              <Button size="lg" className="mt-5 w-full" disabled={!result.items.length} onClick={doImport}>
                Importar {result.items.length} movimientos
              </Button>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, good, bad }: { label: string; value: number; good?: boolean; bad?: boolean }) {
  return (
    <div className="rounded-2xl bg-surface-2 px-2 py-3">
      <p className="text-[11px] text-muted">{label}</p>
      <p className={cn("num text-xl font-semibold", good && value > 0 && "text-pos", bad && "text-neg")}>{value}</p>
    </div>
  );
}
