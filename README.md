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

This guide will walk you through deploying your own private version of this application. You'll get your own website link and a private database that only you can access.

To ensure you can easily update your application in the future, we'll first fork this repository on GitHub and then deploy your fork with Vercel.

### Step 1: Fork the Repository on GitHub

Forking creates a personal copy of the project under your own GitHub account. This is essential for receiving updates later on. You will need a free GitHub account for this step.

1.  **Create or Log In to a GitHub Account:**

    - If you don't have a GitHub account, go to [github.com/join](https://github.com/join) to create a free one. It's quick and easy.
    - If you already have an account, please make sure you are logged in.

2.  **Fork This Project:**
    - Once you are logged into GitHub, return to this project's page.
    - In the top-right corner of the page, find and click the **Fork** button.
    - A new page will open, asking where to fork the repository. Choose your personal GitHub account as the destination.
    - Click the **Create fork** button.

Congratulations, you now have a personal copy of the Bank of Quack project in your GitHub account!

### Step 2: Deploy to Vercel

Now we will connect your forked GitHub repository to Vercel to deploy your application.

1.  **Go to Vercel and Import Project:**

    - Go to your Vercel dashboard: [vercel.com/dashboard](https://vercel.com/dashboard).
    - Click the **Add New...** button and select **Project**.
    - In the "Import Git Repository" section, find your forked `Bank-of-Quack` repository and click the **Import** button next to it.

2.  **Configure the Project:**
    - Vercel will automatically detect that this is a Vite project. You do not need to change any Build & Output Settings.
    - Find and expand the **Environment Variables** section. This is where you will securely add your database keys.

### Step 3: Set Up Supabase & Get Keys

You need two keys from your Supabase project to connect it to your Vercel app. Let's get those now.

1.  **Create Supabase Project:**

    - In a new browser tab, go to [Supabase](https://supabase.com/) and sign in.
    - Create a **New Project**. Use the **free** tier. Give it a name you like and create a secure database password (save it somewhere safe!).

2.  **Get Supabase Keys:**

    - Once the project is created, navigate to **Project Settings** (the gear icon in the left sidebar).
    - Click on **Data API** in the settings menu.
    - Under "Project API Keys", find the **Project URL**. Copy it.
    - Go back to your Vercel tab. In the Environment Variables section, add a new variable. The `Name` is `VITE_SUPABASE_URL` and the `Value` is the URL you just copied.
    - Go back to the Supabase tab, then in the left go to "API Keys". Copy the **Project API Key** (the one that says `anon` and `public`).
    - Return to Vercel. Add a second environment variable. The `Name` is `VITE_SUPABASE_ANON_KEY` and the `Value` is the key you just copied.

3.  **Deploy:**
    - With the environment variables added, click the **Deploy** button on Vercel.
    - Vercel will now start building and deploying your application. You can leave this page and wait for it to finish.

### Step 4: Create Your Database Structure

1.  - While Vercel is building, return to your Supabase project tab.
2.  - In the left sidebar, find the **SQL Editor** (it looks like a database cylinder).
3.  - Click on **New query**.
4.  - Scroll down in _this_ README file to the [Database Schema](#database-schema-ready-to-import-sql) section.
5.  - Copy the entire block of SQL code provided there.
6.  - Paste the code into the Supabase SQL Editor and click **RUN**. This sets up all the necessary tables for the app.

### Step 5: Create Your App Login

1.  - In the Supabase left sidebar, find the **Authentication** page.
2.  - Click the **Add user** button.
3.  - Enter the email and password you want to use to log into your application.
4.  - For the simplest setup, it's recommended to go to the **Providers** > **Email** section and turn **OFF** "Confirm email".

### Step 6: All Done!

Once Vercel has finished (you'll get an email and see it on your Vercel dashboard), you can visit the URL they provide. Log in using the email and password you created in Step 5. Enjoy your private financial tracker!

---

## How to Get Updates

Your deployed version of this app is a private copy and does not automatically receive updates when the original project is improved. Because you forked the repository, you can easily get the latest features and bug fixes.

1.  Navigate to your copy of the repository on GitHub.
2.  You should see a message indicating that your branch is behind the original. Click the **"Sync fork"** button.
3.  A dialog will appear. Click the green **"Update branch"** button.
4.  That's it! GitHub will pull in all the new changes from the original repository. Vercel will automatically detect this update and begin a new deployment for you. Within a few minutes, your site will be running the latest version.

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
-- Create app_settings table
CREATE TABLE public.app_settings (
  key text NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  value text NULL,
  CONSTRAINT app_settings_pkey PRIMARY KEY (key)
) WITH (OIDS=FALSE);

-- Create categories table
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name text NOT NULL,
  image_url text NULL,
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_name_key UNIQUE (name)
) WITH (OIDS=FALSE);

-- Create sectors table
CREATE TABLE public.sectors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT sectors_pkey PRIMARY KEY (id),
  CONSTRAINT sectors_name_key UNIQUE (name)
) WITH (OIDS=FALSE);

-- Create sector_categories table
CREATE TABLE public.sector_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sector_id uuid NOT NULL,
  category_id uuid NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT sector_categories_pkey PRIMARY KEY (id),
  CONSTRAINT uq_sector_category UNIQUE (sector_id, category_id),
  CONSTRAINT sector_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  CONSTRAINT sector_categories_sector_id_fkey FOREIGN KEY (sector_id) REFERENCES sectors(id) ON DELETE CASCADE
) WITH (OIDS=FALSE);

-- Create transactions table
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  date date NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  paid_by_user_name text NOT NULL,
  split_type text NULL,
  transaction_type text NOT NULL DEFAULT 'expense'::text,
  paid_to_user_name text NULL,
  reimburses_transaction_id uuid NULL,
  category_id uuid NULL,
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  CONSTRAINT transactions_reimburses_transaction_id_fkey FOREIGN KEY (reimburses_transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
) WITH (OIDS=FALSE);

-- Create transactions_view
CREATE VIEW public.transactions_view AS
SELECT t.id,
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
       c.name AS category_name
FROM transactions t
LEFT JOIN categories c ON t.category_id = c.id;

-- Policies for app_settings table
CREATE POLICY "Allow authenticated users to read app settings"
ON public.app_settings
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert app settings"
ON public.app_settings
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update app settings"
ON public.app_settings
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete app settings"
ON public.app_settings
FOR DELETE
TO authenticated
USING (true);

-- Policies for categories table
CREATE POLICY "Allow authenticated users to read categories"
ON public.categories
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert categories"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update categories"
ON public.categories
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete categories"
ON public.categories
FOR DELETE
TO authenticated
USING (true);

-- Policies for sectors table
CREATE POLICY "Allow authenticated users to read sectors"
ON public.sectors
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert sectors"
ON public.sectors
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update sectors"
ON public.sectors
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete sectors"
ON public.sectors
FOR DELETE
TO authenticated
USING (true);

-- Policies for sector_categories table
CREATE POLICY "Allow authenticated users to read sector_categories"
ON public.sector_categories
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert sector_categories"
ON public.sector_categories
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update sector_categories"
ON public.sector_categories
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete sector_categories"
ON public.sector_categories
FOR DELETE
TO authenticated
USING (true);

-- Policies for transactions table
CREATE POLICY "Allow authenticated users to read transactions"
ON public.transactions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert transactions"
ON public.transactions
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update transactions"
ON public.transactions
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete transactions"
ON public.transactions
FOR DELETE
TO authenticated
USING (true);

INSERT INTO public.app_settings (key, value) VALUES ('user1_name', 'User 1');
INSERT INTO public.app_settings (key, value) VALUES ('user2_name', 'User 2');
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
