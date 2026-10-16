// Acceso estático a process.env para que Next lo inyecte también en el cliente.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
/** Sin claves de Supabase la app corre en modo demo (datos en el navegador). */
export const isDemo = !SUPABASE_URL || !SUPABASE_KEY;
