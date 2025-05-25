# Bank of Quack

A personal finance tracker for couples, built with React, Vite, and Supabase. Designed for easy, shared expense tracking, with a focus on clarity and fairness. Uses beautiful [shadcn/ui](https://ui.shadcn.com/) components for a modern look and feel.

## Features

- **Dashboard**: See a summary of balances, total expenses, and breakdowns by category and sector. Visualize spending with pie and bar charts.
- **Transactions**: Add, edit, and delete expenses, income, settlements, and reimbursements. Flexible split options (equally, user1 only, user2 only).
- **Categories & Sectors**: Organize expenses into categories (e.g., Groceries, Rent) and group categories into sectors (e.g., Living, Fun).
- **User Customization**: Set custom names and avatars for each user.
- **Filters**: Filter transactions by date, person, category/sector, and description.
- **Responsive UI**: Works great on desktop and mobile.
- **Data Storage**: All data is stored securely in your own Supabase project.

## Tech Stack

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Supabase](https://supabase.com/) (Postgres DB, Auth, Storage)
- [shadcn/ui](https://ui.shadcn.com/) (Radix UI + Tailwind CSS)
- [Recharts](https://recharts.org/) (for charts)
- [@tanstack/react-table](https://tanstack.com/table/latest) (for tables)
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
- In your project, create the following tables (see below for schema).
- Go to Project Settings > API and copy your `Project URL` and `anon` key.

#### Environment Variables

Create a `.env.local` file in the root:

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Database Schema (Ready-to-Import SQL)

Paste the following SQL into the SQL Editor in Supabase to create all required tables and relationships:

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

-- Enable storage for avatars (in Supabase Storage, not SQL)
-- Go to Storage in Supabase and create a bucket called 'avatars'.
```

### 5. Run the App

```sh
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Customization

- **User Names & Avatars**: Go to the Settings page to set your names and upload avatars.
- **Categories & Sectors**: Add, edit, or delete categories and sectors in Settings.
- **Split Logic**: When adding an expense, choose how it's split (equally, user1 only, user2 only).
- **Charts**: Dashboard shows breakdowns by sector and category.

## Notes

- This app is designed for two users (e.g., you and your partner), but you can rename them to anything.
- All UI components are built with [shadcn/ui](https://ui.shadcn.com/) for a modern, accessible experience.
- All data is private to your Supabase project. If you want to share with family/friends, they'll need their own Supabase setup.

## Screenshots

_(Add your own screenshots here!)_

## License

MIT (or whatever you prefer)
