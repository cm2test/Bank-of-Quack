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

> **Recommended:** Fork this repo first for easier updates later!<br>
> The Deploy button will prompt you for your Supabase project URL and anon/public key.

[![Deploy with Vercel](https://vercel.com/button)](<https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fchrischambers888%2Fbank-of-quack&project-name=bank-of-quack&repository-name=bank-of-quack&env=VITE_SUPABASE_URL,VITE_SUPABASE_ANON_KEY&envDescription=Enter%20your%20Supabase%20project%20URL%20and%20anon%20(public)%20key%20from%20your%20Supabase%20project%20settings.>)

1. **Fork this repo** to your own GitHub account (click the Fork button at the top right).
2. Click the **Deploy with Vercel** button above.
3. When prompted, enter your Supabase project URL and anon/public key (find these in your Supabase project settings under API).
4. Choose a project name & region, then deploy.

The first build:

- runs `supabase db push`
- creates the six Storage buckets + RLS policies
- creates all tables / views / seed rows in `supabase/migrations/`

Open the deployment URL, sign up with any email/password, and start tracking.

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
