-- 2024070601_budgets.sql
-- Add budget functionality: tables, views, policies
---------------------------------------------------------------

--------------------
--  TABLES
--------------------

-- Budget configuration table
create table if not exists public.category_budgets (
  id                    uuid primary key default gen_random_uuid(),
  category_id           uuid not null references public.categories(id) on delete cascade,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  is_active             boolean not null default true,
  budget_type           text not null check (budget_type in ('absolute', 'split')),
  absolute_amount       numeric check (absolute_amount > 0),
  user1_amount          numeric check (user1_amount >= 0),
  user2_amount          numeric check (user2_amount >= 0),
  constraint uq_category_budget unique (category_id),
  constraint chk_budget_amounts check (
    (budget_type = 'absolute' and absolute_amount is not null and user1_amount is null and user2_amount is null) or
    (budget_type = 'split' and absolute_amount is null and user1_amount is not null and user2_amount is not null)
  )
);

-- Budget periods table (for tracking monthly budgets)
create table if not exists public.budget_periods (
  id                    uuid primary key default gen_random_uuid(),
  category_budget_id    uuid not null references public.category_budgets(id) on delete cascade,
  year                  integer not null,
  month                 integer not null check (month between 1 and 12),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  budget_amount         numeric not null check (budget_amount > 0),
  spent_amount          numeric not null default 0 check (spent_amount >= 0),
  user1_spent           numeric not null default 0 check (user1_spent >= 0),
  user2_spent           numeric not null default 0 check (user2_spent >= 0),
  constraint uq_budget_period unique (category_budget_id, year, month)
);

--------------------
--  VIEWS
--------------------

-- Enhanced transactions view with budget information
drop view if exists public.transactions_with_budgets;
create view public.transactions_with_budgets as
select 
  t.id,
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
  c.name as category_name,
  cb.id as budget_id,
  cb.budget_type,
  cb.absolute_amount as budget_absolute_amount,
  cb.user1_amount as budget_user1_amount,
  cb.user2_amount as budget_user2_amount,
  bp.id as budget_period_id,
  bp.budget_amount as period_budget_amount,
  bp.spent_amount as period_spent_amount,
  bp.user1_spent as period_user1_spent,
  bp.user2_spent as period_user2_spent,
  case 
    when bp.budget_amount > 0 then 
      round(((bp.budget_amount - bp.spent_amount) / bp.budget_amount) * 100, 2)
    else null 
  end as budget_remaining_percentage,
  case 
    when bp.budget_amount > 0 then 
      bp.budget_amount - bp.spent_amount
    else null 
  end as budget_remaining_amount
from public.transactions t
left join public.categories c on t.category_id = c.id
left join public.category_budgets cb on t.category_id = cb.category_id and cb.is_active = true
left join public.budget_periods bp on cb.id = bp.category_budget_id 
  and extract(year from t.date) = bp.year 
  and extract(month from t.date) = bp.month
where t.transaction_type = 'expense';

-- Budget summary view
create view public.budget_summary as
select 
  c.id as category_id,
  c.name as category_name,
  c.image_url as category_image,
  cb.id as budget_id,
  cb.budget_type,
  cb.absolute_amount,
  cb.user1_amount,
  cb.user2_amount,
  cb.is_active,
  extract(year from current_date) as current_year,
  extract(month from current_date) as current_month,
  bp.budget_amount as current_period_budget,
  bp.spent_amount as current_period_spent,
  bp.user1_spent as current_period_user1_spent,
  bp.user2_spent as current_period_user2_spent,
  case 
    when bp.budget_amount > 0 then 
      round(((bp.budget_amount - bp.spent_amount) / bp.budget_amount) * 100, 2)
    else null 
  end as current_period_remaining_percentage,
  case 
    when bp.budget_amount > 0 then 
      bp.budget_amount - bp.spent_amount
    else null 
  end as current_period_remaining_amount
from public.categories c
left join public.category_budgets cb on c.id = cb.category_id
left join public.budget_periods bp on cb.id = bp.category_budget_id 
  and bp.year = extract(year from current_date)
  and bp.month = extract(month from current_date);

--------------------
--  FUNCTIONS
--------------------

-- Function to create or update budget period
create or replace function public.upsert_budget_period(
  p_category_budget_id uuid,
  p_year integer,
  p_month integer,
  p_budget_amount numeric
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_period_id uuid;
begin
  -- Insert or update budget period
  insert into public.budget_periods (
    category_budget_id, 
    year, 
    month, 
    budget_amount
  )
  values (p_category_budget_id, p_year, p_month, p_budget_amount)
  on conflict (category_budget_id, year, month)
  do update set 
    budget_amount = p_budget_amount,
    updated_at = now()
  returning id into v_period_id;
  
  return v_period_id;
end;
$$;

-- Function to update spent amounts for a budget period
create or replace function public.update_budget_spent(
  p_category_id uuid,
  p_year integer,
  p_month integer
)
returns void
language plpgsql
security definer
as $$
declare
  v_budget_id uuid;
  v_total_spent numeric := 0;
  v_user1_spent numeric := 0;
  v_user2_spent numeric := 0;
begin
  -- Get the active budget for this category
  select id into v_budget_id
  from public.category_budgets
  where category_id = p_category_id and is_active = true;
  
  if v_budget_id is null then
    return;
  end if;
  
  -- Calculate total spent for the period
  select 
    coalesce(sum(amount), 0),
    coalesce(sum(case when paid_by_user_name = (select value from public.app_settings where key = 'user1_name') then amount else 0 end), 0),
    coalesce(sum(case when paid_by_user_name = (select value from public.app_settings where key = 'user2_name') then amount else 0 end), 0)
  into v_total_spent, v_user1_spent, v_user2_spent
  from public.transactions
  where category_id = p_category_id
    and transaction_type = 'expense'
    and extract(year from date) = p_year
    and extract(month from date) = p_month;
  
  -- Update the budget period
  update public.budget_periods
  set 
    spent_amount = v_total_spent,
    user1_spent = v_user1_spent,
    user2_spent = v_user2_spent,
    updated_at = now()
  where category_budget_id = v_budget_id
    and year = p_year
    and month = p_month;
end;
$$;

--------------------
--  TRIGGERS
--------------------

-- Trigger to automatically update budget spent amounts when transactions change
create or replace function public.handle_transaction_budget_update()
returns trigger
language plpgsql
as $$
begin
  -- Update budget spent amounts for the transaction's date
  if tg_op = 'INSERT' or tg_op = 'UPDATE' then
    perform public.update_budget_spent(
      new.category_id,
      extract(year from new.date),
      extract(month from new.date)
    );
    return new;
  elsif tg_op = 'DELETE' then
    perform public.update_budget_spent(
      old.category_id,
      extract(year from old.date),
      extract(month from old.date)
    );
    return old;
  end if;
  
  return null;
end;
$$;

-- Create trigger on transactions table
drop trigger if exists trigger_transaction_budget_update on public.transactions;
create trigger trigger_transaction_budget_update
  after insert or update or delete on public.transactions
  for each row
  execute function public.handle_transaction_budget_update();

--------------------
--  ENABLE RLS
--------------------
alter table public.category_budgets enable row level security;
alter table public.budget_periods enable row level security;

--------------------
--  POLICIES
--------------------

-- Policies for category_budgets
create policy "category_budgets_all" on public.category_budgets
  for all
  to authenticated
  using (true)
  with check (true);

-- Policies for budget_periods
create policy "budget_periods_all" on public.budget_periods
  for all
  to authenticated
  using (true)
  with check (true);

--------------------
--  INDEXES
--------------------

-- Indexes for better performance
create index if not exists idx_category_budgets_category_id on public.category_budgets(category_id);
create index if not exists idx_category_budgets_active on public.category_budgets(is_active);
create index if not exists idx_budget_periods_budget_id on public.budget_periods(category_budget_id);
create index if not exists idx_budget_periods_year_month on public.budget_periods(year, month);
create index if not exists idx_transactions_category_date on public.transactions(category_id, date) where transaction_type = 'expense';