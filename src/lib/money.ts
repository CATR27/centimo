export interface CurrencyInfo {
  code: string;
  label: string;
  decimals: number;
  locale: string;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: "COP", label: "Peso colombiano", decimals: 0, locale: "es-CO" },
  { code: "USD", label: "Dólar estadounidense", decimals: 2, locale: "es-US" },
  { code: "EUR", label: "Euro", decimals: 2, locale: "es-ES" },
  { code: "MXN", label: "Peso mexicano", decimals: 2, locale: "es-MX" },
  { code: "ARS", label: "Peso argentino", decimals: 2, locale: "es-AR" },
  { code: "CLP", label: "Peso chileno", decimals: 0, locale: "es-CL" },
  { code: "PEN", label: "Sol peruano", decimals: 2, locale: "es-PE" },
  { code: "BRL", label: "Real brasileño", decimals: 2, locale: "pt-BR" },
  { code: "GBP", label: "Libra esterlina", decimals: 2, locale: "en-GB" },
];

export const currencyInfo = (code: string): CurrencyInfo =>
  CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[1];

const cache = new Map<string, Intl.NumberFormat>();
const fmt = (code: string, compact: boolean) => {
  const key = `${code}:${compact}`;
  let f = cache.get(key);
  if (!f) {
    const c = currencyInfo(code);
    f = new Intl.NumberFormat(c.locale, {
      style: "currency",
      currency: c.code,
      minimumFractionDigits: compact ? 0 : c.decimals,
      maximumFractionDigits: compact ? 1 : c.decimals,
      notation: compact ? "compact" : "standard",
    });
    cache.set(key, f);
  }
  return f;
};

export const toMajor = (minor: number, code: string) => minor / 10 ** currencyInfo(code).decimals;
export const toMinor = (major: number, code: string) =>
  Math.round(major * 10 ** currencyInfo(code).decimals);

/** Modo privado: oculta todos los montos. Lo activa el StoreProvider antes de renderizar. */
let privacyOn = false;
export const setPrivacy = (on: boolean) => { privacyOn = on; };
const MASK = "••••";

export const formatMoney = (minor: number, code: string) =>
  privacyOn ? MASK : fmt(code, false).format(toMajor(minor, code));
export const formatCompact = (minor: number, code: string) =>
  privacyOn ? MASK : fmt(code, true).format(toMajor(minor, code));

export const currencySymbol = (code: string) =>
  fmt(code, false).formatToParts(0).find((p) => p.type === "currency")?.value ?? code;
