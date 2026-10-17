"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { z } from "zod";
import { AnimatedIcon } from "@/components/animated-icon";
import { Avatar } from "@/components/avatar";
import { Welcome } from "@/components/auth-welcome";
import { BrandLoader } from "@/components/brand-loader";
import { PillInput } from "@/components/ui/input";
import { Logo, ThemeToggleIcon } from "@/components/ui/misc";
import { getProviderStatus, resetPassword, signIn, signInWithMagicLink, signInWithProvider, signUp, type Provider, type ProviderStatus } from "@/lib/auth";
import { isDemo } from "@/lib/supabase/env";
import { cn } from "@/lib/utils";

type Mode = "login" | "signup" | "forgot";

const emailSchema = z.string().trim().email("Correo no válido");
const passSchema = z.string().min(6, "Mínimo 6 caracteres");

const COPY: Record<Mode, { title: string; sub: string; cta: string }> = {
  login: { title: "Bienvenido de vuelta", sub: "Entra para ver el estado de tu dinero.", cta: "Entrar" },
  signup: { title: "Crea tu cuenta", sub: "Empieza a controlar tus gastos en un minuto.", cta: "Crear cuenta" },
  forgot: { title: "Recupera tu acceso", sub: "Te enviaremos un enlace para crear una contraseña nueva.", cta: "Enviar enlace" },
};

/** 0–4 según longitud, mayúsculas/minúsculas, números y símbolos. */
function strength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return pw.length === 0 ? 0 : Math.max(1, s);
}
const STRENGTH_LABEL = ["", "Débil", "Regular", "Buena", "Fuerte"];
const STRENGTH_COLOR = ["", "bg-neg", "bg-amber", "bg-cyan", "bg-pos"];

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="size-[22px]" aria-hidden>
    <path fill="#4285F4" d="M22.5 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8z" />
    <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2.1v2.8A11 11 0 0 0 12 23z" />
    <path fill="#FBBC05" d="M5.7 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8l3.6-2.8z" />
    <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1A11 11 0 0 0 2.1 7.1l3.6 2.8C6.6 7.4 9.1 5.4 12 5.4z" />
  </svg>
);
const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" className="size-[22px]" fill="currentColor" aria-hidden>
    <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z" />
  </svg>
);
const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" className="size-[22px]" fill="#5865F2" aria-hidden>
    <path d="M20.32 4.37A19.8 19.8 0 0 0 15.4 2.9a.07.07 0 0 0-.08.04c-.21.38-.45.87-.61 1.26a18.3 18.3 0 0 0-5.42 0 12.6 12.6 0 0 0-.62-1.26.08.08 0 0 0-.08-.04 19.7 19.7 0 0 0-4.93 1.47.07.07 0 0 0-.03.03C.53 9.05-.32 13.58.1 18.06a.08.08 0 0 0 .03.06 19.9 19.9 0 0 0 5.99 3.03.08.08 0 0 0 .08-.03c.46-.63.87-1.3 1.23-2a.08.08 0 0 0-.04-.1 13 13 0 0 1-1.87-.9.08.08 0 0 1-.01-.13c.13-.09.25-.19.37-.29a.07.07 0 0 1 .08-.01c3.93 1.8 8.18 1.8 12.07 0a.07.07 0 0 1 .08.01c.12.1.25.2.37.29a.08.08 0 0 1 0 .13c-.6.35-1.22.65-1.87.9a.08.08 0 0 0-.04.1c.36.7.77 1.37 1.23 2a.08.08 0 0 0 .08.03 19.8 19.8 0 0 0 6-3.03.08.08 0 0 0 .03-.05c.5-5.18-.84-9.67-3.55-13.66a.06.06 0 0 0-.03-.03zM8.02 15.33c-1.18 0-2.16-1.09-2.16-2.42s.96-2.42 2.16-2.42c1.21 0 2.18 1.1 2.16 2.42 0 1.33-.96 2.42-2.16 2.42zm7.97 0c-1.18 0-2.16-1.09-2.16-2.42s.95-2.42 2.16-2.42c1.21 0 2.18 1.1 2.16 2.42 0 1.33-.95 2.42-2.16 2.42z" />
  </svg>
);

const WELCOME_KEY = "centimo:welcome-seen";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "form" | Provider>(null);
  const [show, setShow] = useState(false);
  const [magic, setMagic] = useState(false);
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [entering, setEntering] = useState(false);
  const [enabled, setEnabled] = useState<ProviderStatus | null>(null);
  // Bienvenida solo en móvil y una vez por sesión (oculta con CSS en escritorio).
  const [welcome, setWelcome] = useState(mode === "login");
  useEffect(() => { getProviderStatus().then(setEnabled); }, []);
  useEffect(() => {
    try { if (sessionStorage.getItem(WELCOME_KEY)) setWelcome(false); } catch { /* sin storage: se muestra */ }
  }, []);
  const copy = COPY[mode];
  const score = useMemo(() => strength(password), [password]);
  const usesPassword = mode !== "forgot" && !magic;
  const cta = magic ? "Enviarme el enlace" : copy.cta;

  const closeWelcome = () => {
    try { sessionStorage.setItem(WELCOME_KEY, "1"); } catch { /* ignorar */ }
    setWelcome(false);
  };

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") ?? "").trim();
    const email = String(f.get("email") ?? "");
    const pw = String(f.get("password") ?? "");

    const errs: Record<string, string> = {};
    const em = emailSchema.safeParse(email);
    if (!isDemo && !em.success) errs.email = em.error.issues[0].message;
    if (usesPassword && !isDemo) {
      const p = passSchema.safeParse(pw);
      if (!p.success) errs.password = p.error.issues[0].message;
    }
    if (mode === "signup" && !isDemo && !name) errs.name = "Dinos cómo llamarte";
    setErrors(errs);
    setNotice(null);
    if (Object.keys(errs).length) return;

    setBusy("form");
    let err: string | null = null;
    if (magic) {
      err = await signInWithMagicLink(email);
      if (!err && !isDemo) { setNotice("Te enviamos un enlace. Revisa tu correo para entrar."); setBusy(null); return; }
    } else if (mode === "login") err = await signIn(email, pw);
    else if (mode === "signup") {
      const r = await signUp(name, email, pw);
      err = r.error;
      if (!err && r.needsConfirm) { setNotice("Revisa tu correo para confirmar la cuenta."); setBusy(null); return; }
    } else {
      err = await resetPassword(email);
      if (!err) { setNotice("Si el correo existe, te enviamos un enlace."); setBusy(null); return; }
    }
    if (err) { setErrors({ form: err }); setBusy(null); return; }
    setEntering(true);
    router.replace("/dashboard");
    router.refresh();
  }

  async function social(p: Provider) {
    setErrors({}); setNotice(null);
    setBusy(p);
    // Si la consulta de proveedores aún no terminó, la esperamos antes de redirigir.
    const status = enabled ?? (await getProviderStatus());
    if (!status[p]) {
      setEnabled(status);
      setErrors({ form: "Este método aún no está activado. Usa tu correo o un enlace mágico." });
      setBusy(null);
      return;
    }
    const err = await signInWithProvider(p);
    if (err) { setErrors({ form: err }); setBusy(null); }
    else if (isDemo) { setEntering(true); router.replace("/dashboard"); }
  }

  const providers: { id: Provider; label: string; Icon: () => React.ReactElement; soon: boolean }[] = [
    { id: "google", label: "Google", Icon: GoogleIcon, soon: !!enabled && !enabled.google },
    { id: "github", label: "GitHub", Icon: GitHubIcon, soon: !!enabled && !enabled.github },
    { id: "discord", label: "Discord", Icon: DiscordIcon, soon: !!enabled && !enabled.discord },
  ];

  return (
    <div className="flex flex-1 flex-col lg:block">
      {/* Transición de entrada: se mantiene hasta que la navegación desmonta el login. */}
      {entering && <BrandLoader duration={1100} />}
      {welcome && mode === "login" && (
        <Welcome onEnter={closeWelcome} onCreate={() => { closeWelcome(); router.replace("/signup"); }} />
      )}

      {/* Cabecera móvil */}
      <div className="flex items-center justify-between lg:hidden">
        <button type="button" onClick={() => (mode === "forgot" ? router.replace("/login") : setWelcome(true))} aria-label="Volver"
          className={cn("grid size-12 place-items-center rounded-full bg-surface transition active:scale-95", mode === "signup" && "invisible")}>
          <AnimatedIcon name="atras" strokeWidth={2} className="size-[22px]" />
        </button>
        <Logo className="[&_img]:h-[30px]" />
        <ThemeToggleIcon />
      </div>

      {mode === "forgot" ? (
        <Link href="/login" className="mb-2 mt-4 hidden items-center gap-2 text-sm font-semibold text-ink/70 hover:text-ink lg:inline-flex">
          <AnimatedIcon name="atras" strokeWidth={2} className="size-4" /> Volver
        </Link>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-1 rounded-full bg-surface p-1 lg:mt-0" role="tablist" aria-label="Acceso">
          {([["login", "/login", "Entrar"], ["signup", "/signup", "Crear cuenta"]] as const).map(([m, href, label]) => (
            <Link key={m} href={href} role="tab" aria-selected={mode === m} replace
              className={cn("grid h-[46px] place-items-center rounded-full text-[15px] font-semibold transition", mode === m ? "bg-lime text-lime-ink" : "text-ink/60 hover:text-ink")}>
              {label}
            </Link>
          ))}
        </div>
      )}

      <h1 className="mt-4 text-[32px] font-semibold leading-[1.05] lg:mt-7 lg:text-[40px] lg:leading-none">{magic ? "Entra con un enlace" : copy.title}</h1>
      <p className="mt-1 text-[15px] text-muted lg:mt-1.5 lg:text-base">{magic ? "Escribe tu correo y te enviamos un enlace de un solo uso." : copy.sub}</p>

      <form onSubmit={onSubmit} className="mt-3.5 flex flex-col lg:mt-6" noValidate>
        <div className="flex flex-col gap-2.5">
          {mode === "signup" && !magic && (
            <Fieldset error={errors.name}>
              <PillInput name="name" autoComplete="name" placeholder="Tu nombre" icon={<AnimatedIcon name="categorias" strokeWidth={1.8} className="size-[19px]" />} />
            </Fieldset>
          )}
          <Fieldset error={errors.email}>
            <PillInput name="email" type="email" inputMode="email" autoComplete="email" placeholder="tu@correo.com"
              icon={<AnimatedIcon name="mail" strokeWidth={1.8} className="size-[19px]" />} />
          </Fieldset>

          {usesPassword && (
            <Fieldset error={errors.password}>
              <PillInput
                name="password" type={show ? "text" : "password"} placeholder="••••••••" value={password}
                onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"}
                icon={<AnimatedIcon name="candado" strokeWidth={1.8} className="size-[19px]" />}
                end={
                  <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={show}
                    className="grid size-[42px] shrink-0 place-items-center rounded-full bg-surface-2 transition active:scale-95">
                    <AnimatedIcon name="privado" strokeWidth={1.8} className="size-[19px]" />
                  </button>
                }
              />
              {mode === "signup" && password && (
                <div className="mt-2.5 flex items-center gap-3 px-2" aria-live="polite">
                  <div className="grid flex-1 grid-cols-4 gap-1.5" aria-hidden>
                    {[1, 2, 3, 4].map((n) => <span key={n} className={cn("h-1.5 rounded-full bg-surface transition-colors", score >= n && STRENGTH_COLOR[score])} />)}
                  </div>
                  <span className="w-14 text-right text-xs font-semibold text-muted">{STRENGTH_LABEL[score]}</span>
                </div>
              )}
            </Fieldset>
          )}

          {mode === "login" && !magic && (
            <Link href="/forgot" className="self-end whitespace-nowrap px-1.5 py-0.5 text-sm font-semibold text-ink/60 hover:text-ink">¿Olvidaste tu contraseña?</Link>
          )}
        </div>

        {errors.form && <p role="alert" className="mt-2.5 rounded-3xl bg-neg/10 px-4 py-2.5 text-sm text-neg">{errors.form}</p>}
        {notice && <p role="status" className="mt-2.5 rounded-3xl bg-pos/10 px-4 py-2.5 text-sm font-medium text-pos">{notice}</p>}

        <button type="submit" disabled={busy !== null}
          className="group mt-2.5 flex h-[62px] items-center justify-between rounded-full bg-accent pl-[26px] pr-2 text-[17px] font-semibold text-accent-ink transition active:scale-[.985] disabled:opacity-60">
          {cta}
          <span className="grid size-[46px] place-items-center rounded-full bg-lime text-lime-ink">
            {busy === "form" ? <Loader2 className="size-[22px] animate-spin" /> : <AnimatedIcon name="adelante" strokeWidth={2.2} className="size-[22px]" />}
          </span>
        </button>
      </form>

      {mode !== "forgot" && (
        <>
          <div className="mt-3.5 flex items-center gap-3 text-[13px] text-muted lg:mt-6">
            <span className="h-px flex-1 bg-line" />o continúa con<span className="h-px flex-1 bg-line" />
          </div>
          <div className="mt-3 grid grid-cols-4 justify-items-center gap-2 lg:mt-4">
            {providers.map(({ id, label, Icon, soon }) => (
              <button key={id} type="button" onClick={() => social(id)} disabled={busy !== null} aria-label={`Continuar con ${label}`}
                className="flex flex-col items-center gap-1.5 text-[13px] font-medium transition active:scale-95 disabled:opacity-60">
                <span className="relative grid size-[62px] place-items-center rounded-full bg-surface lg:size-16">
                  {busy === id ? <Loader2 className="size-[22px] animate-spin" /> : <Icon />}
                  {soon && <span aria-hidden className="absolute -right-1 -top-1 rounded-full bg-amber/25 px-1.5 py-px text-[8px] font-bold uppercase tracking-wider text-amber">Pronto</span>}
                </span>
                {label}
              </button>
            ))}
            <button type="button" onClick={() => { setMagic((v) => !v); setErrors({}); setNotice(null); }} aria-pressed={magic}
              aria-label={magic ? "Usar contraseña" : "Entrar con enlace mágico"}
              className="flex flex-col items-center gap-1.5 text-[13px] font-medium transition active:scale-95">
              <span className={cn("grid size-[62px] place-items-center rounded-full bg-lime text-lime-ink lg:size-16", magic && "ring-2 ring-ink")}>
                <AnimatedIcon name="clip" strokeWidth={1.8} className="size-[22px]" />
              </span>
              {magic ? "Clave" : "Enlace"}
            </button>
          </div>
        </>
      )}

      {mode !== "forgot" && (
        <Link href={mode === "login" ? "/signup" : "/login"} replace
          className="mt-auto grid grid-cols-[64px_minmax(0,1fr)_44px] items-center gap-3 rounded-full bg-surface py-1 pl-1.5 pr-2 transition active:scale-[.99] lg:mt-6">
          <Avatar n={5} className="size-16" />
          <span className="flex flex-col leading-tight">
            <span className="text-[15px] font-semibold">{mode === "login" ? "¿Nuevo en Céntimo?" : "¿Ya tienes cuenta?"}</span>
            <span className="text-[13px] text-muted">{mode === "login" ? "Crea tu cuenta en un minuto." : "Entra y sigue donde lo dejaste."}</span>
          </span>
          <span className="grid size-11 place-items-center rounded-full bg-lime text-lime-ink"><AnimatedIcon name="adelante" strokeWidth={2.2} className="size-5" /></span>
        </Link>
      )}

      <p className="mt-2.5 text-center text-xs leading-normal text-muted lg:mt-4">
        Al continuar aceptas los términos de uso y la política de privacidad de Centimo.
      </p>
    </div>
  );
}

function Fieldset({ error, children }: { error?: string; children: React.ReactNode }) {
  return (
    <div>
      {children}
      {error && <span role="alert" className="mt-1 block px-4 text-xs text-neg">{error}</span>}
    </div>
  );
}
