-- Centimo 0002: cuentas/billeteras, etiquetas, transferencias y presupuesto global.

alter table public.profiles
  add column if not exists monthly_budget bigint check (monthly_budget is null or monthly_budget >= 0);

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null check (char_length(name) between 1 and 40),
  type text not null default 'cash' check (type in ('cash','bank','card','savings')),
  color text not null default '#2a9d7c',
  opening_balance bigint not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists accounts_user_idx on public.accounts (user_id);

alter table public.accounts enable row level security;
drop policy if exists "accounts own" on public.accounts;
create policy "accounts own" on public.accounts for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.transactions
  add column if not exists account_id uuid references public.accounts(id) on delete set null,
  add column if not exists transfer_id uuid,
  add column if not exists tags text[] not null default '{}';
create index if not exists transactions_account_idx on public.transactions (account_id);

-- La política de movimientos también valida que la cuenta sea del usuario.
drop policy if exists "transactions own" on public.transactions;
create policy "transactions own" on public.transactions for all
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (category_id is null or exists (
      select 1 from public.categories c where c.id = category_id and c.user_id = auth.uid()))
    and (account_id is null or exists (
      select 1 from public.accounts a where a.id = account_id and a.user_id = auth.uid()))
  );

-- Cuenta "Efectivo" para usuarios existentes y nuevos.
insert into public.accounts (user_id, name, type, color)
select u.id, 'Efectivo', 'cash', '#2a9d7c' from auth.users u
where not exists (select 1 from public.accounts a where a.user_id = u.id);

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

  insert into public.accounts (user_id, name, type, color) values (new.id, 'Efectivo', 'cash', '#2a9d7c');
  return new;
end $$;
