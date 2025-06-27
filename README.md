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

### 🛠️ After deploying: Apply the database schema (run migrations)

To finish setup, you need to apply the database schema and create storage buckets in your Supabase project. This is easiest and most reliable using the Supabase CLI.

#### **Option 1: Manual setup**

- Run the SQL from the "init_schema.sql" file in the Supabase SQL Editor

#### **Option 2: Use the Supabase CLI (recommended, works for all migrations)**

1. **Install Node.js and npm**

   - Go to [nodejs.org](https://nodejs.org/) and download the LTS version for your operating system.
   - Install it (this gives you both `node` and `npm`).

2. **Install the Supabase CLI**

   ```bash
   npm install -g supabase
   ```

3. **Log in to Supabase**

   ```bash
   supabase login
   ```

   - This will open a browser window to authenticate.

4. **Link the CLI to your project**
   In your project folder (where you cloned/forked the repo):

   ```bash
   supabase link --project-ref <your-project-ref>
   ```

   - You can find your project ref (id) in the Supabase dashboard URL or in Project Settings → General.

5. **Run the migrations**
   ```bash
   supabase db push
   ```
   - This will apply all migrations, including creating storage buckets and policies.

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
