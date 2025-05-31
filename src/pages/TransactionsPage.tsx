// src/pages/TransactionsPage.tsx
import React from "react"; // Added React import for clarity, though often implicit
import { useOutletContext } from "react-router-dom";
import TransactionForm from "../components/TransactionForm";

interface TransactionsPageContext {
  addTransaction: (t: Partial<any>) => void;
}

const TransactionsPage: React.FC = () => {
  // Get the full context from Outlet
  const context = useOutletContext<any>();

  return (
    <div className="max-w-4xl mx-auto w-full p-4 mt-12">
      {/* The TransactionForm will dynamically change its title and behavior 
          based on whether `editingTransaction` is set in the context */}
      <TransactionForm
        onAddTransaction={context.addTransaction}
        context={context}
      />
    </div>
  );
};

export default TransactionsPage;
