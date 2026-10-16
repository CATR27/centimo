# Centimo

App web (Next.js 15 + TypeScript + Tailwind v4) para registrar gastos hechos y próximos, categorizarlos y analizarlos. Mobile-first, estilo terminal de trading con acentos neón, tema claro/oscuro y PWA instalable.

## Arrancar

```bash
npm install
npm run dev      # http://localhost:3000
```

Sin variables de entorno corre en **modo demo**: cualquier credencial entra y los datos viven en `localStorage`.

## Conectar Supabase (login y datos reales)

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En *SQL Editor* ejecuta `supabase/migrations/0001_init.sql` (tablas, RLS y categorías por defecto).
3. Copia `.env.example` a `.env.local` y pega `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (o la `ANON_KEY` legada) (*Project Settings → API*).
4. En *Authentication → URL Configuration* añade `http://localhost:3000/auth/callback` (y tu dominio de producción). Para Google, activa el proveedor en *Authentication → Providers*.

## Estructura

- `src/app/(auth)` login, registro, recuperación · `src/app/(app)` panel, historial, próximos, análisis, categorías, ajustes
- `src/lib/store.tsx` estado con actualizaciones optimistas · `src/lib/data/*` repos Supabase y local
- `src/lib/analytics.ts` agregaciones para gráficas · `src/components/charts` gráficas neón (Recharts)

## Iniciar sesión con Google, GitHub, Discord o enlace mágico

El login ofrece cuatro métodos además de correo y contraseña. El **enlace mágico** funciona desde el primer momento
(usa el correo de Supabase, con límite bajo de envíos por hora). Los **proveedores sociales** hay que activarlos una vez
en Supabase → *Authentication → Providers*; mientras no estén activos el botón muestra «Pronto» y avisa con un mensaje claro.

Para todos usa esta **URL de callback** en la app del proveedor: `https://<tu-proyecto>.supabase.co/auth/v1/callback`
y añade `http://localhost:3000/**` (y tu dominio) en *Authentication → URL Configuration → Redirect URLs*.

- **Google**: Google Cloud Console → *APIs y servicios → Credenciales → ID de cliente OAuth* (tipo «Aplicación web») → copia Client ID y Secret a Supabase.
- **GitHub**: GitHub → *Settings → Developer settings → OAuth Apps → New* → copia Client ID y genera un Client Secret.
- **Discord**: [discord.com/developers/applications](https://discord.com/developers/applications) → *New Application → OAuth2* → copia Client ID y Secret.

## Marca

Logos en `public/brand/` (`logo-light.png` para tema claro, `logo-dark.png` para tema oscuro, `icon.png` y los íconos del manifest).
El componente `Logo` alterna la versión según el tema.
