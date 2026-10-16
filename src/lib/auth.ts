"use client";

import { SUPABASE_KEY, SUPABASE_URL, isDemo } from "./supabase/env";
import { supabase } from "./supabase/client";

const KEY = "centimo:demo:session";

export type Provider = "google" | "github" | "discord";

export const demoSignedIn = () => {
  try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
};

const demoLogin = () => { try { localStorage.setItem(KEY, "1"); } catch {} };

export async function signIn(email: string, password: string): Promise<string | null> {
  if (isDemo) { demoLogin(); return null; }
  const { error } = await supabase().auth.signInWithPassword({ email, password });
  return error ? translate(error.message) : null;
}

export async function signUp(name: string, email: string, password: string): Promise<{ error: string | null; needsConfirm: boolean }> {
  if (isDemo) { demoLogin(); return { error: null, needsConfirm: false }; }
  const { data, error } = await supabase().auth.signUp({
    email, password,
    options: { data: { full_name: name }, emailRedirectTo: `${location.origin}/auth/callback` },
  });
  return { error: error ? translate(error.message) : null, needsConfirm: !error && !data.session };
}

export type ProviderStatus = Record<Provider, boolean>;

/** Qué proveedores sociales están activados en Supabase (endpoint público de ajustes). */
export async function getProviderStatus(): Promise<ProviderStatus> {
  const all: ProviderStatus = { google: true, github: true, discord: true };
  if (isDemo) return all;
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: SUPABASE_KEY } });
    if (!r.ok) return all;
    const ext = (await r.json()).external as Record<string, boolean> | undefined;
    if (!ext) return all;
    return { google: !!ext.google, github: !!ext.github, discord: !!ext.discord };
  } catch {
    return all; // sin red: dejamos intentar y que el servidor responda
  }
}

/** Inicio de sesión con un proveedor OAuth. Redirige al proveedor; vuelve por /auth/callback. */
export async function signInWithProvider(provider: Provider): Promise<string | null> {
  if (isDemo) { demoLogin(); return null; }
  const { error } = await supabase().auth.signInWithOAuth({
    provider, options: { redirectTo: `${location.origin}/auth/callback` },
  });
  return error ? translate(error.message) : null;
}

/** Enlace mágico: envía un correo con un enlace de un solo uso (sin contraseña). */
export async function signInWithMagicLink(email: string): Promise<string | null> {
  if (isDemo) { demoLogin(); return null; }
  const { error } = await supabase().auth.signInWithOtp({
    email, options: { emailRedirectTo: `${location.origin}/auth/callback` },
  });
  return error ? translate(error.message) : null;
}

export async function resetPassword(email: string): Promise<string | null> {
  if (isDemo) return null;
  const { error } = await supabase().auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/auth/callback` });
  return error ? translate(error.message) : null;
}

export async function signOut() {
  if (isDemo) { try { localStorage.removeItem(KEY); } catch {} }
  else await supabase().auth.signOut();
}

function translate(msg: string) {
  const m = msg.toLowerCase();
  if (m.includes("provider is not enabled") || m.includes("unsupported provider")) return "Este método aún no está activado. Usa Google o tu correo.";
  if (m.includes("invalid login")) return "Correo o contraseña incorrectos.";
  if (m.includes("already registered")) return "Este correo ya tiene una cuenta.";
  if (m.includes("email not confirmed")) return "Confirma tu correo antes de entrar.";
  if (m.includes("rate limit") || m.includes("too many")) return "Demasiados intentos. Espera un momento.";
  if (m.includes("signups not allowed") || m.includes("signup is disabled")) return "El registro está desactivado temporalmente.";
  if (m.includes("password")) return "La contraseña debe tener al menos 6 caracteres.";
  return msg;
}
