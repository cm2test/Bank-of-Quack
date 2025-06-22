// src/pages/TransactionsPage.tsx
import React from "react"; // Added React import for clarity, though often implicit
import { useOutletContext } from "react-router-dom";
import TransactionForm from "../components/TransactionForm";
import DuckFabNav from "@/components/dashboard/DuckFabNav";
import { Transaction, Category } from "@/types";

interface TransactionsPageContext {
  userNames: string[];
  categories: Category[];
  transactions: Transaction[];
  editingTransaction: Transaction | null;
  addTransaction: (t: Partial<Transaction>) => void;
  updateTransaction: (t: Partial<Transaction>) => void;
  handleSetEditingTransaction: (t: Transaction | null) => void;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const TransactionsPage: React.FC = () => {
  // Get the full context from Outlet
  const context = useOutletContext<TransactionsPageContext>();

  return (
    <>
      <div className="max-w-4xl mx-auto w-full p-4">
        {/* The TransactionForm will dynamically change its title and behavior 
            based on whether `editingTransaction` is set in the context */}
        <TransactionForm
          userNames={context.userNames}
          categories={context.categories}
          transactions={context.transactions}
          editingTransaction={context.editingTransaction}
          addTransaction={context.addTransaction}
          updateTransaction={context.updateTransaction}
          handleSetEditingTransaction={context.handleSetEditingTransaction}
        />
      </div>
      <DuckFabNav open={context.open} setOpen={context.setOpen} />
    </>
  );
};

export default TransactionsPage;
