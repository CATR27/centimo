"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { resetPassword, signIn, signInWithGoogle, signUp } from "@/lib/auth";
import { isDemo } from "@/lib/supabase/env";

type Mode = "login" | "signup" | "forgot";

const emailSchema = z.string().trim().email("Correo no válido");
const passSchema = z.string().min(6, "Mínimo 6 caracteres");

const COPY: Record<Mode, { title: string; sub: string; cta: string }> = {
  login: { title: "Bienvenido de vuelta", sub: "Entra para ver tu panel.", cta: "Entrar" },
  signup: { title: "Crea tu cuenta", sub: "Empieza a controlar tus gastos hoy.", cta: "Crear cuenta" },
  forgot: { title: "Recupera tu acceso", sub: "Te enviaremos un enlace por correo.", cta: "Enviar enlace" },
};

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const copy = COPY[mode];

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") ?? "").trim();
    const email = String(f.get("email") ?? "");
    const password = String(f.get("password") ?? "");

    const errs: Record<string, string> = {};
    const em = emailSchema.safeParse(email);
    if (!isDemo && !em.success) errs.email = em.error.issues[0].message;
    if (mode !== "forgot" && !isDemo) {
      const p = passSchema.safeParse(password);
      if (!p.success) errs.password = p.error.issues[0].message;
    }
    if (mode === "signup" && !isDemo && !name) errs.name = "Dinos cómo llamarte";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    setNotice(null);
    let err: string | null = null;
    if (mode === "login") err = await signIn(email, password);
    else if (mode === "signup") {
      const r = await signUp(name, email, password);
      err = r.error;
      if (!err && r.needsConfirm) { setNotice("Revisa tu correo para confirmar la cuenta."); setBusy(false); return; }
    } else {
      err = await resetPassword(email);
      if (!err) { setNotice("Si el correo existe, te enviamos un enlace."); setBusy(false); return; }
    }
    if (err) { setErrors({ form: err }); setBusy(false); return; }
    router.replace("/dashboard");
    router.refresh();
  }

  async function google() {
    setBusy(true);
    const err = await signInWithGoogle();
    if (err) { setErrors({ form: err }); setBusy(false); }
    else if (isDemo) router.replace("/dashboard");
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
      <p className="mt-1 text-sm text-muted">{copy.sub}</p>

      <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate>
        {mode === "signup" && (
          <Field label="Nombre" error={errors.name}>
            <Input name="name" autoComplete="name" placeholder="Tu nombre" />
          </Field>
        )}
        <Field label="Correo" error={errors.email}>
          <Input name="email" type="email" inputMode="email" autoComplete="email" placeholder="tu@correo.com" />
        </Field>
        {mode !== "forgot" && (
          <Field label="Contraseña" error={errors.password}>
            <div className="relative">
              <Input
                name="password" type={show ? "text" : "password"} className="pr-12" placeholder="••••••••"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
              />
              <button
                type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-1.5 top-1.5 grid size-10 place-items-center rounded-full text-muted"
              >
                {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
          </Field>
        )}

        {mode === "login" && (
          <div className="text-right">
            <Link href="/forgot" className="text-xs font-medium text-muted hover:text-ink">¿Olvidaste tu contraseña?</Link>
          </div>
        )}

        {errors.form && <p role="alert" className="rounded-2xl bg-neg/10 px-4 py-2.5 text-sm text-neg">{errors.form}</p>}
        {notice && <p role="status" className="rounded-2xl bg-pos/10 px-4 py-2.5 text-sm text-pos">{notice}</p>}

        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy && <Loader2 className="size-4 animate-spin" />} {copy.cta}
        </Button>
      </form>

      {mode !== "forgot" && (
        <>
          <div className="my-5 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-line" /> o <span className="h-px flex-1 bg-line" />
          </div>
          <Button variant="outline" size="lg" className="w-full" onClick={google} disabled={busy}>
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
              <path fill="#4285F4" d="M22.5 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.700 3.3-8z" />
              <path fill="#34A853" d="M12 23c3 0 5.500-1 7.300-2.700l-3.500-2.700c-1 .7-2.300 1.100-3.800 1.100-2.900 0-5.400-2-6.300-4.600H2.100v2.800A11 11 0 0 0 12 23z" />
              <path fill="#FBBC05" d="M5.700 14.100a6.600 6.600 0 0 1 0-4.200V7.100H2.100a11 11 0 0 0 0 9.800l3.600-2.800z" />
              <path fill="#EA4335" d="M12 5.400c1.600 0 3.100.6 4.200 1.700l3.100-3.100A11 11 0 0 0 2.100 7.100l3.600 2.800C6.600 7.400 9.100 5.400 12 5.400z" />
            </svg>
            Continuar con Google
          </Button>
        </>
      )}

      <p className="mt-7 text-center text-sm text-muted">
        {mode === "login" && <>¿Sin cuenta? <Link href="/signup" className="font-semibold text-ink underline underline-offset-4">Regístrate</Link></>}
        {mode === "signup" && <>¿Ya tienes cuenta? <Link href="/login" className="font-semibold text-ink underline underline-offset-4">Entra</Link></>}
        {mode === "forgot" && <Link href="/login" className="font-semibold text-ink underline underline-offset-4">Volver a entrar</Link>}
      </p>
    </div>
  );
}
