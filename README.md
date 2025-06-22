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

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fchrischambers888%2FBank-of-Quack&env=VITE_SUPABASE_URL,VITE_SUPABASE_ANON_KEY&envDescription=You%20need%20to%20get%20these%20from%20your%20Supabase%20project%20API%20settings.&project-name=my-bank-of-quack&repository-name=my-bank-of-quack)

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

1.  In the Supabase left sidebar, find the **Authentication** page.
2.  Click the **Add new user** button, then "Create new user".
3.  Enter the email and password you want to use to log into your application.
4.  It's recommended to go to the **Providers** > **Email** section and turn **OFF** "Confirm email" for the simplest setup.

### Step 5: All Done!

Once Vercel has finished (you'll get an email and see it on your Vercel dashboard), you can visit the URL they provide. Log in using the email and password you created in Step 4. Enjoy your private financial tracker!

### Step 6: Go Live! (Trigger Production Deployment)

The first time you set this up, Vercel creates a "preview". To make your site fully live at its main address, you need to make one small change.

1.  Go to the new repository Vercel created for you in your GitHub account. (It should be named something like `my-bank-of-quack`).
2.  Click on the `README.md` file.
3.  Click the **pencil icon** (Edit this file) in the top-right corner of the file view.
4.  You don't have to change anything significant. Just add a space or an emoji at the end of a sentence.
5.  Scroll to the bottom of the page and click the green **Commit changes...** button.
6.  That's it! This new commit will automatically tell Vercel to build a "Production" version of your site. After a few minutes, your website will be live at its main URL.

---

## How to Get Updates

Your deployed version of this app is a private copy and does not automatically receive updates when the original project is improved. To get the latest features and bug fixes, you can easily sync your repository with the original.

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
