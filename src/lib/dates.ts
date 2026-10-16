import {
  addDays, addMonths, addWeeks, addYears, differenceInCalendarDays, endOfMonth, endOfYear,
  format, parseISO, startOfMonth, startOfYear, subDays, subMonths, subYears,
} from "date-fns";
import { es } from "date-fns/locale";
import type { Recurrence } from "./types";

export const ISO = "yyyy-MM-dd";
export const toISO = (d: Date) => format(d, ISO);
export const today = () => toISO(new Date());
export const parse = (s: string) => parseISO(s);

export type Period = "7D" | "30D" | "MES" | "AÑO";
export const PERIODS: Period[] = ["7D", "30D", "MES", "AÑO"];

export interface Range { from: string; to: string }

/** Rango actual y el rango anterior equivalente (para deltas). */
export function periodRanges(p: Period, now = new Date()): { current: Range; previous: Range; days: number } {
  let from: Date, to: Date, pFrom: Date, pTo: Date;
  switch (p) {
    case "7D": to = now; from = subDays(now, 6); pTo = subDays(from, 1); pFrom = subDays(pTo, 6); break;
    case "30D": to = now; from = subDays(now, 29); pTo = subDays(from, 1); pFrom = subDays(pTo, 29); break;
    case "MES": from = startOfMonth(now); to = endOfMonth(now);
      pFrom = startOfMonth(subMonths(now, 1)); pTo = endOfMonth(subMonths(now, 1)); break;
    case "AÑO": from = startOfYear(now); to = endOfYear(now);
      pFrom = startOfYear(subYears(now, 1)); pTo = endOfYear(subYears(now, 1)); break;
  }
  return {
    current: { from: toISO(from), to: toISO(to) },
    previous: { from: toISO(pFrom), to: toISO(pTo) },
    days: differenceInCalendarDays(to, from) + 1,
  };
}

export const inRange = (date: string, r: Range) => date >= r.from && date <= r.to;

export function nextOccurrence(date: string, rec: Exclude<Recurrence, null>): string {
  const d = parse(date);
  return toISO(rec === "weekly" ? addWeeks(d, 1) : rec === "monthly" ? addMonths(d, 1) : addYears(d, 1));
}

export const addDaysISO = (date: string, n: number) => toISO(addDays(parse(date), n));
export const daysUntil = (date: string) => differenceInCalendarDays(parse(date), new Date());

export function relativeDay(date: string): string {
  const n = daysUntil(date);
  if (n === 0) return "Hoy";
  if (n === 1) return "Mañana";
  if (n === -1) return "Ayer";
  if (n > 1 && n < 7) return format(parse(date), "EEEE", { locale: es });
  return format(parse(date), "d MMM", { locale: es });
}

export const dayHeading = (date: string) => {
  const n = daysUntil(date);
  if (n === 0) return "Hoy";
  if (n === -1) return "Ayer";
  return format(parse(date), "EEEE d 'de' MMM", { locale: es });
};

export const fmtDate = (date: string, pattern = "d MMM yyyy") => format(parse(date), pattern, { locale: es });
