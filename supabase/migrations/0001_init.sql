-- Centimo: esquema inicial. Ejecutar en Supabase → SQL Editor.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  currency text not null default 'COP',
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null check (char_length(name) between 1 and 40),
  icon text not null default 'tag',
  color text not null default '#00ff9d',
  kind text not null default 'expense' check (kind in ('expense','income')),
  monthly_budget bigint check (monthly_budget is null or monthly_budget >= 0),
  created_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  category_id uuid references public.categories(id) on delete set null,
  amount bigint not null check (amount > 0),
  type text not null check (type in ('expense','income')),
  note text not null default '',
  date date not null,
  status text not null default 'paid' check (status in ('paid','planned')),
  recurrence text check (recurrence in ('weekly','monthly','yearly')),
  created_at timestamptz not null default now()
);

create index transactions_user_date_idx on public.transactions (user_id, date desc);
create index categories_user_idx on public.categories (user_id);

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;

create policy "profiles own" on public.profiles for all
  using (id = auth.uid()) with check (id = auth.uid());
create policy "categories own" on public.categories for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "transactions own" on public.transactions for all
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (category_id is null or exists (
      select 1 from public.categories c where c.id = category_id and c.user_id = auth.uid()))
  );

-- Al registrarse: perfil + categorías por defecto.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));

  insert into public.categories (user_id, name, icon, color, kind) values
    (new.id, 'Comida', 'utensils', '#ff6b35', 'expense'),
    (new.id, 'Transporte', 'car', '#22d3ee', 'expense'),
    (new.id, 'Hogar', 'home', '#4d7cff', 'expense'),
    (new.id, 'Ocio', 'gamepad', '#ff2e97', 'expense'),
    (new.id, 'Salud', 'heart', '#00ff9d', 'expense'),
    (new.id, 'Suscripciones', 'repeat', '#a78bfa', 'expense'),
    (new.id, 'Compras', 'bag', '#ffb800', 'expense'),
    (new.id, 'Educación', 'book', '#c6ff00', 'expense'),
    (new.id, 'Salario', 'wallet', '#00ff9d', 'income'),
    (new.id, 'Otros ingresos', 'trending', '#2dd4bf', 'income');
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
