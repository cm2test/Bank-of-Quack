-- 20250624124500_init_schema.sql
-- Initial application schema: tables, view, policies, seed rows
---------------------------------------------------------------

--------------------
--  TABLES
--------------------
create table if not exists public.app_settings (
  key         text primary key,
  updated_at  timestamptz not null default now(),
  value       text
);

create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null unique,
  image_url   text
);

create table if not exists public.sectors (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  created_at  timestamptz not null default now()
);

create table if not exists public.sector_categories (
  id          uuid primary key default gen_random_uuid(),
  sector_id   uuid not null references public.sectors(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  created_at  timestamptz default now(),
  constraint uq_sector_category unique (sector_id, category_id)
);

create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  date        date not null,
  description text not null,
  amount      numeric not null,
  paid_by_user_name text not null,
  split_type  text,
  transaction_type text not null default 'expense',
  paid_to_user_name text,
  reimburses_transaction_id uuid references public.transactions(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null
);

--------------------
--  VIEW
--------------------
create view if not exists public.transactions_view as
select t.id,
       t.created_at,
       t.date,
       t.description,
       t.amount,
       t.paid_by_user_name,
       t.split_type,
       t.transaction_type,
       t.paid_to_user_name,
       t.reimburses_transaction_id,
       t.category_id,
       c.name as category_name
from public.transactions t
left join public.categories c on t.category_id = c.id;

--------------------
--  ENABLE RLS
--------------------
alter table public.app_settings        enable row level security;
alter table public.categories          enable row level security;
alter table public.sectors             enable row level security;
alter table public.sector_categories   enable row level security;
alter table public.transactions        enable row level security;

--------------------
--  POLICIES  (create only if absent)
--------------------
do $$
declare
  rec record;
begin
  -- helper: creates a policy only if it does not already exist
  for rec in
    select * from (values
      ('app_settings',       'app_settings_all'),
      ('categories',         'categories_all'),
      ('sectors',            'sectors_all'),
      ('sector_categories',  'sector_categories_all'),
      ('transactions',       'transactions_all')
    ) as p(tbl, pol)
  loop
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename  = rec.tbl
        and policyname = rec.pol
    ) then
      execute format(
        'create policy %I on public.%I
           for all
           to authenticated
           using (true)
           with check (true);',
        rec.pol, rec.tbl
      );
    end if;
  end loop;
end $$;

--------------------
--  SEED SETTINGS  (insert once)
--------------------
insert into public.app_settings (key, value)
values ('user1_name', 'User 1')
on conflict (key) do nothing;

insert into public.app_settings (key, value)
values ('user2_name', 'User 2')
on conflict (key) do nothing;
