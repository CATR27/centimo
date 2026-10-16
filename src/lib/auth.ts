"use client";

import { isDemo } from "./supabase/env";
import { supabase } from "./supabase/client";

const KEY = "centimo:demo:session";

export const demoSignedIn = () => {
  try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
};

export async function signIn(email: string, password: string): Promise<string | null> {
  if (isDemo) { localStorage.setItem(KEY, "1"); return null; }
  const { error } = await supabase().auth.signInWithPassword({ email, password });
  return error ? translate(error.message) : null;
}

export async function signUp(name: string, email: string, password: string): Promise<{ error: string | null; needsConfirm: boolean }> {
  if (isDemo) { localStorage.setItem(KEY, "1"); return { error: null, needsConfirm: false }; }
  const { data, error } = await supabase().auth.signUp({
    email, password,
    options: { data: { full_name: name }, emailRedirectTo: `${location.origin}/auth/callback` },
  });
  return { error: error ? translate(error.message) : null, needsConfirm: !error && !data.session };
}

export async function signInWithGoogle(): Promise<string | null> {
  if (isDemo) { localStorage.setItem(KEY, "1"); return null; }
  const { error } = await supabase().auth.signInWithOAuth({
    provider: "google", options: { redirectTo: `${location.origin}/auth/callback` },
  });
  return error ? translate(error.message) : null;
}

export async function resetPassword(email: string): Promise<string | null> {
  if (isDemo) return null;
  const { error } = await supabase().auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/auth/callback` });
  return error ? translate(error.message) : null;
}

export async function signOut() {
  if (isDemo) localStorage.removeItem(KEY);
  else await supabase().auth.signOut();
}

function translate(msg: string) {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "Correo o contraseña incorrectos.";
  if (m.includes("already registered")) return "Este correo ya tiene una cuenta.";
  if (m.includes("email not confirmed")) return "Confirma tu correo antes de entrar.";
  if (m.includes("rate limit")) return "Demasiados intentos. Espera un momento.";
  if (m.includes("password")) return "La contraseña debe tener al menos 6 caracteres.";
  return msg;
}
