-- 20240624_init.sql
-- Initial application schema: tables, view, policies, seed rows, buckets
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
  paid_by_user_name text,
  split_type  text,
  transaction_type text not null default 'expense',
  paid_to_user_name text,
  reimburses_transaction_id uuid references public.transactions(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null
);

--------------------
--  VIEW
--------------------
drop view if exists public.transactions_view;
create view public.transactions_view as
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

--------------------
--  BUCKETS
--------------------

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('avatars',              'avatars',              true),
  ('category-images',      'category-images',      true),
  ('empty-state-images',   'empty-state-images',   true),
  ('income-images',        'income-images',        true),
  ('reimbursement-images', 'reimbursement-images', true),
  ('settlement-images',    'settlement-images',    true)
ON CONFLICT (id) DO NOTHING;   -- safe if someone re-applies the migration

------------------------------------------------------------
-- 2. Clean up: drop policies with the same names if they exist
------------------------------------------------------------
DROP POLICY IF EXISTS authenticated_can_read   ON storage.objects;
DROP POLICY IF EXISTS authenticated_can_insert ON storage.objects;
DROP POLICY IF EXISTS authenticated_can_update ON storage.objects;
DROP POLICY IF EXISTS authenticated_can_delete ON storage.objects;

------------------------------------------------------------
-- 3. Authenticated users can READ (download / list)
------------------------------------------------------------
CREATE POLICY authenticated_can_read
  ON storage.objects
  FOR SELECT
  USING (auth.uid() IS NOT NULL);   -- anon = NULL → blocked

------------------------------------------------------------
-- 4. Authenticated users can CREATE objects
------------------------------------------------------------
CREATE POLICY authenticated_can_insert
  ON storage.objects
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

------------------------------------------------------------
-- 5. Authenticated users can EDIT existing objects
------------------------------------------------------------
CREATE POLICY authenticated_can_update
  ON storage.objects
  FOR UPDATE
  USING     (auth.uid() IS NOT NULL)   -- who may run UPDATE
  WITH CHECK(auth.uid() IS NOT NULL);  -- NEW row must also satisfy

------------------------------------------------------------
-- 6. Authenticated users can DELETE objects
------------------------------------------------------------
CREATE POLICY authenticated_can_delete
  ON storage.objects
  FOR DELETE
  USING (auth.uid() IS NOT NULL);