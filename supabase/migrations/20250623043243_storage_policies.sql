-- 20250624123047_storage_policies.sql
-- *********************************************
--  Storage buckets + row-level-security policies
-- *********************************************

-- 1️⃣  Create buckets (idempotent: runs once then lives on)
select storage.create_bucket('avatars',            true);
select storage.create_bucket('category-images',    true);
select storage.create_bucket('empty-state-images', true);
select storage.create_bucket('income-images',      true);
select storage.create_bucket('reimbursement-images', true);
select storage.create_bucket('settlement-images',  true);

-- 2️⃣  Grant “logged-in users can read / insert / update objects in their bucket”
do $$
begin
  perform
    -- avatars
    ( select 1 from pg_catalog.pg_policy
      where polname = 'avatars_rw_for_logged_in_users' );
  if not found then
    create policy "avatars_rw_for_logged_in_users"
      on storage.objects
      for all
      using  ( bucket_id = 'avatars'            and auth.uid() is not null )
      with check ( bucket_id = 'avatars'        and auth.uid() is not null );
  end if;

  -- repeat the 6-line block for each bucket, changing the name + bucket_id
  -- (polname must be unique in the table)
end $$;
