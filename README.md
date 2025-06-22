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

## Deploy Your Own Bank of Quack (No Code Required)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fch-chambers%2FBank-of-Quack-V3&env=VITE_SUPABASE_URL,VITE_SUPABASE_ANON_KEY&envDescription=You%20need%20to%20get%20these%20from%20your%20Supabase%20project%20API%20settings.&project-name=my-bank-of-quack&repository-name=my-bank-of-quack)

This guide will walk you through deploying your own private version of this application. You'll get your own website link and a private database that only you can access.

### Step 1: Start the Deployment

1.  Click the **Deploy with Vercel** button above.
2.  You'll be taken to the Vercel website. You will need to create a free account (using GitHub is recommended).
3.  Sign in with your github, authorize vercel whenever asked, then add your own GitHub as the "Git Scope" when you are creating the vercel project. Click Create.
4.  Vercel will automatically start setting up the project for you. It will ask for two "Environment Variables": `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Leave this browser tab open and proceed to the next step to get these keys.

### Step 2: Set Up Your Private Database (Supabase)

1.  In a new browser tab, go to [Supabase](https://supabase.com/) and sign in using your GitHub account.
2.  Create a **New Organization and New Project**. Use the **free** tier. Give it a name you like and create a secure database password (be sure to save it somewhere safe!). Select "Canada (Central) as the region".
3.  Once the project is created, navigate to **Project Settings** (the gear icon in the left sidebar).
4.  Click on ** Data API**. You will see your project's API details.
5.  Copy the **Project URL**. Go back to your Vercel tab and paste it into the `VITE_SUPABASE_URL` field.
6.  Go to "API Keys" in the left menu. Copy the **Project API Key** (the one that says `anon` and `public`). Go back to Vercel and paste it into the `VITE_SUPABASE_ANON_KEY` field.
7.  Now, click **Deploy** on the Vercel page. Vercel will start building your website.

### Step 3: Create Your Database Structure

1.  While Vercel is building, return to your Supabase project tab.
2.  In the left sidebar, find the **SQL Editor** (it looks like a database cylinder).
3.  Click on **New query**. (or new snippet)
4.  Scroll down in _this_ README file to the [Database Schema](#4-database-schema-ready-to-import-sql) section.
5.  Copy the entire block of SQL code provided there.
6.  Paste the code into the Supabase SQL Editor and click **RUN**. This sets up all the necessary tables for the app.

### Step 4: Create Your App Login

1.  In the Supabase left sidebar, find the **Authentication** page (it looks like a person icon).
2.  Click the **Create user** button.
3.  Enter the email and password you want to use to log into your application.
4.  It's recommended to go to the **Providers** > **Email** section and turn **OFF** "Confirm email" for the simplest setup.

### Step 5: All Done!

Once Vercel has finished (you'll get an email and see it on your Vercel dashboard), you can visit the URL they provide. Log in using the email and password you created in Step 4. Enjoy your private financial tracker!

---

## Manual Developer Setup

For developers who want to run the project locally or contribute to the code.

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

### 4. Database Schema (Ready-to-Import-SQL)

Paste the following SQL into the **SQL Editor** in Supabase to create all required tables and relationships:

```sql
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
CREATE POLICY "Users can update their own avatars" ON storage.objects FOR UPDATE using ( auth.uid()::text = owner_id );
CREATE POLICY "Users can delete their own avatars" ON storage.objects FOR DELETE using ( auth.uid()::text = owner_id );
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
