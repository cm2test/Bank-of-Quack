# Bank of Quack — two-person finance tracker

A lightweight money tracker for couples built with **React + Vite** on a **Supabase** backend and styled with **shadcn/ui**.  
Track shared expenses, reimbursements and income, see live balances, and keep everything fair-and-square.

---

## ✨ Features

|                          |                                                                                |
| ------------------------ | ------------------------------------------------------------------------------ |
| **Secure auth**          | Supabase email + password (RLS everywhere)                                     |
| **Dashboard**            | Live balances, pie & bar spending charts                                       |
| **Transactions**         | Add / edit expenses, income, settlements, reimbursements; flexible split logic |
| **Categories & Sectors** | Nest categories under sectors for tidy reports                                 |
| **CSV import / export**  | Own your data                                                                  |
| **User avatars & names** | Personalise each half of the household                                         |
| **Responsive UI**        | Works great on phone, tablet, desktop                                          |

---

## 🛠 Tech stack

- **Frontend** – React 18, Vite, shadcn/ui (Radix UI + Tailwind), Recharts, React-Table v8, React-Hook-Form + Zod, Lucide icons
- **Backend** – Supabase (Postgres + Auth + Storage) with **declarative SQL migrations**
- **TypeScript** everywhere

---

## 🚀 Deployment

**Before you start:**

1. **Create a GitHub account** (if you don't have one already).
2. **Sign up for Vercel** and **Supabase** using your GitHub account.
3. **Create a new Supabase project** in your Supabase dashboard.
4. In your Supabase project, go to **Settings → Data API** and copy:
   - `Project URL` (for `VITE_SUPABASE_URL`)
   - `Then in the left section go to "API Keys" and find:`
   - --> `anon/public API key` (for `VITE_SUPABASE_ANON_KEY`)
5. **Fork this repo** to your own GitHub account (click the Fork button at the top right).

> The Deploy button will prompt you for your Supabase project URL and anon/public key.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new>)

6. Click the **Deploy with Vercel** button above.
7. Choose "Bank of Quack"
8. Before deploying **\*you must**, enter your Supabase project URL and anon/public key (from step 4) in the "Enviornment Settings" section.

### 🛠️ After deploying: Apply the database schema (run initial migration)

To finish setup, you need to apply the database schema and create storage buckets in your Supabase project.

- Run the SQL from the "init_schema.sql" file in the Supabase SQL Editor (left menu)
- Create new snippet, paste below code, run

```sql
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
```

### 👤 Create your first user and log in

After applying the migrations, you need to create your first user account in Supabase so you can log in to the app.

1. **Go to your Supabase dashboard.**
2. In the left sidebar, click **Auth**.
3. Click **Users**.
4. Click **Add User**.
5. Enter an email and password for your first user (this will be your login for the app).
6. Click **Create User**.

Now, go to your deployed app URL and log in with the email and password you just created. You're ready to go!

---

## 🔄 Keeping your copy up-to-date

### Easiest: GitHub's **Sync fork** button

Open your repo on GitHub → click **Sync fork → Update branch**.  
Vercel sees the push and deploys the new version automatically.

## 📝 Customisation pointers

- **Rename users / upload avatars** – Settings → _Profile_
- **Add categories & sectors** – Settings → _Categories_
- **Change split defaults or add more reports** – edit the React components in `src/features/**`

---

## 📸 Screenshots

_(drop some dashboard / mobile screenshots here)_

---

## License

MIT © _you_
