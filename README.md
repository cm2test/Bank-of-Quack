# Bank of Quack V3

A personal finance tracker for couples, rebuilt with React, Vite, and Supabase. Designed for easy, shared expense tracking with a focus on clarity, fairness, and a great user experience. Uses beautiful [shadcn/ui](https://ui.shadcn.com/) components for a modern look and feel.

## Features

- **Secure Authentication**: Private login for your household using Supabase Auth (email/password).
- **Dashboard**: See a summary of balances, total expenses, and breakdowns by category and sector. Visualize spending with pie and bar charts.
- **Transactions**: Add, edit, and delete expenses, income, settlements, and reimbursements. Flexible split options (equally, user1 only, user2 only).
- **Data Management**: Easily import and export all your transaction data via CSV files.
- **Categories & Sectors**: Organize expenses into categories (e.g., Groceries, Rent) and group categories into sectors (e.g., Living, Fun).
- **User Customization**: Set custom names and upload avatars for each user.
- **Advanced Filtering**: Filter transactions by date range, user, category/sector, and description.
- **Responsive UI**: Works great on desktop and mobile.
- **Data Storage**: All data is stored securely in your own private Supabase project.

## Tech Stack

- [React](https://react.dev/) & [Vite](https://vitejs.dev/)
- [Supabase](https://supabase.com/) (Postgres DB, Auth, Storage)
- [shadcn/ui](https://ui.shadcn.com/) (Radix UI + Tailwind CSS)
- [Recharts](https://recharts.org/) for charts
- [@tanstack/react-table](https://tanstack.com/table/latest) for tables
- [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/) for form handling and validation
- [Lucide React](https://lucide.dev/guide/packages/lucide-react) for icons
- TypeScript

## Getting Started

### 1. Clone the Repo

```sh
git clone https://github.com/yourusername/bank-of-quack.git
cd bank-of-quack-v3
```

### 2. Install Dependencies

```sh
npm install
```

### 3. Set Up Supabase

- Go to [Supabase](https://supabase.com/) and create a new project.
- Go to **Authentication** > **Providers** and enable **Email**. Disable "Confirm email".
- Go to **Authentication** > **Users** and click **Create user** to add your first user.
- In your project, go to **Project Settings** > **API** and copy your `Project URL` and `anon` key.

#### Environment Variables

Create a `.env.local` file in the root:

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Database Schema (Ready-to-Import SQL)

Paste the following SQL into the **SQL Editor** in Supabase to create all required tables and relationships:

```sql
-- Transactions table
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  amount numeric not null,
  date date not null,
  transaction_type text not null, -- 'expense', 'income', 'settlement', 'reimbursement'
  category_id uuid references categories(id),
  category_name text,
  paid_by_user_name text,
  paid_to_user_name text,
  split_type text, -- 'splitEqually', 'user1_only', 'user2_only'
  reimburses_transaction_id uuid references transactions(id) on delete set null,
  created_at timestamptz default now()
);

-- Categories table
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null
);

-- Sectors table
create table if not exists sectors (
  id uuid primary key default gen_random_uuid(),
  name text unique not null
);

-- Sector-Categories join table
create table if not exists sector_categories (
  sector_id uuid references sectors(id) on delete cascade,
  category_id uuid references categories(id) on delete cascade,
  primary key (sector_id, category_id)
);

-- App settings (for user names, avatars, etc.)
create table if not exists app_settings (
  key text primary key,
  value text
);

-- Enable Row Level Security (RLS)
-- This is a basic setup. You might want to customize rules based on your needs.
alter table transactions enable row level security;
create policy "Users can see their own transactions." on transactions for select using (auth.uid() is not null);
create policy "Users can insert their own transactions." on transactions for insert with check (auth.uid() is not null);
create policy "Users can update their own transactions." on transactions for update using (auth.uid() is not null);
create policy "Users can delete their own transactions." on transactions for delete using (auth.uid() is not null);

alter table categories enable row level security;
create policy "Users can manage categories." on categories for all using (auth.uid() is not null);

alter table sectors enable row level security;
create policy "Users can manage sectors." on sectors for all using (auth.uid() is not null);

alter table sector_categories enable row level security;
create policy "Users can manage sector-category links." on sector_categories for all using (auth.uid() is not null);

alter table app_settings enable row level security;
create policy "Users can manage app settings." on app_settings for all using (auth.uid() is not null);


-- Enable storage for avatars (in Supabase Storage, not SQL)
-- Go to Storage in Supabase, create a bucket called 'avatars', and make it public.
-- Add policies to allow users to manage their own avatar images.
CREATE POLICY "Users can upload avatars" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'avatars' AND auth.uid() IS NOT NULL );
CREATE POLICY "Users can view all avatars" ON storage.objects FOR SELECT USING ( bucket_id = 'avatars' );
CREATE POLICY "Users can update their own avatars" ON storage.objects FOR UPDATE using ( auth.uid() = owner_id );
CREATE POLICY "Users can delete their own avatars" ON storage.objects FOR DELETE using ( auth.uid() = owner_id );
```

### 5. Run the App

```sh
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser and log in with the user you created in Supabase.

## Customization

- **User Names & Avatars**: Go to the Settings page to set your names and upload avatars.
- **Categories & Sectors**: Add, edit, or delete categories and sectors in Settings.
- **Data**: Use the import/export feature in Settings to manage your transaction history.
- **Split Logic**: When adding an expense, choose how it's split (equally, user1 only, user2 only).
- **Charts**: Dashboard shows breakdowns by sector and category.

## Notes

- This app is designed for two users (e.g., you and your partner), but you can rename them to anything.
- All UI components are built with [shadcn/ui](https://ui.shadcn.com/) for a modern, accessible experience.
- All data is private to your Supabase project. Log in to get started.

## Screenshots

_(Add your own screenshots here!)_

## License

MIT (or whatever you prefer)
