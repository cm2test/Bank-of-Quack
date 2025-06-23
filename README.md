# Bank of Quack V3 — two-person finance tracker

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

## 🚀 One-click deploy (zero coding)

> Creates a private Supabase project, injects all keys into Vercel, applies the DB schema & storage buckets automatically.  
> Total time: ± 60 seconds.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/chrischambers888/bank-of-quack&project-name=bank-of-quack&repository-name=bank-of-quack&stores=[{%22type%22:%22integration%22,%22integrationSlug%22:%22supabase%22,%22productSlug%22:%22supabase%22}])

1. Click **Deploy with Vercel**.
2. Pick (or create) a GitHub account → _Vercel forks the repo for you._
3. Pick **Create new Supabase project** → _Vercel installs the official Supabase Integration._
4. Choose project name & region → **Done.**

The first build:

- runs `supabase db push`
- creates the six Storage buckets + RLS policies
- creates all tables / views / seed rows in `supabase/migrations/`

Open the deployment URL, sign up with any email/password, and start tracking.  
_No copy-pasting keys, no GitHub secrets, no SQL console._

---

## 🧑‍💻 Local developer setup

```bash
# 1 clone the fork (created by the Deploy button)
git clone https://github.com/<you>/bank-of-quack.git
cd bank-of-quack

# 2 install deps
npm install

# 3 pull env vars from Vercel
npm i -g vercel
vercel env pull .env.local

# 4 run
npm run dev
# → http://localhost:5173
```

Need a local database too?
Install Docker and run supabase start; the CLI spins up Postgres + Studio and re-applies the migrations.

## 🔄 Keeping your copy up-to-date

### Easiest: GitHub’s **Sync fork** button

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
