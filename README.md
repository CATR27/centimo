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
