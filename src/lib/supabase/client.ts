import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL } from "./env";

let client: ReturnType<typeof createBrowserClient> | null = null;

export const supabase = () => (client ??= createBrowserClient(SUPABASE_URL, SUPABASE_KEY));
