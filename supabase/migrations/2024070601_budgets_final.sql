-- 2024070601_budgets_final.sql
-- Fix budget functionality: update views and functions only
---------------------------------------------------------------

--------------------
--  UPDATE VIEWS
--------------------

-- Drop and recreate budget summary view (removes is_active field)
drop view if exists public.budget_summary;
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

-- Drop and recreate transactions with budgets view (removes is_active filter)
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
left join public.category_budgets cb on t.category_id = cb.category_id
left join public.budget_periods bp on cb.id = bp.category_budget_id 
  and extract(year from t.date) = bp.year 
  and extract(month from t.date) = bp.month
where t.transaction_type = 'expense';

--------------------
--  UPDATE FUNCTIONS
--------------------

-- Update the function to remove is_active check
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
  -- Get the budget for this category (no is_active filter)
  select id into v_budget_id
  from public.category_budgets
  where category_id = p_category_id;
  
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

-- Update the trigger function to use proper type casting
create or replace function public.handle_transaction_budget_update()
returns trigger
language plpgsql
as $$
begin
  -- Update budget spent amounts for the transaction's date
  if tg_op = 'INSERT' or tg_op = 'UPDATE' then
    perform public.update_budget_spent(
      new.category_id,
      extract(year from new.date)::integer,
      extract(month from new.date)::integer
    );
    return new;
  elsif tg_op = 'DELETE' then
    perform public.update_budget_spent(
      old.category_id,
      extract(year from old.date)::integer,
      extract(month from old.date)::integer
    );
    return old;
  end if;
  
  return null;
end;
$$;

-- Recreate the trigger
drop trigger if exists trigger_transaction_budget_update on public.transactions;
create trigger trigger_transaction_budget_update
  after insert or update or delete on public.transactions
  for each row
  execute function public.handle_transaction_budget_update(); 