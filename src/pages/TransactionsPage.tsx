// src/pages/TransactionsPage.tsx
import React from "react"; // Added React import for clarity, though often implicit
import { useOutletContext } from "react-router-dom";
import TransactionForm from "../components/TransactionForm";
import { Transaction } from "../App";

interface TransactionsPageContext {
  addTransaction: (t: Partial<Transaction>) => void;
}

const TransactionsPage: React.FC = () => {
  // addTransaction is used by TransactionForm when NOT editing.
  // editingTransaction, updateTransaction are handled internally by TransactionForm via context.
  const { addTransaction } = useOutletContext<TransactionsPageContext>();

  return (
    <div>
      {/* The TransactionForm will dynamically change its title and behavior 
          based on whether `editingTransaction` is set in the context */}
      <TransactionForm onAddTransaction={addTransaction} />
    </div>
  );
};

export default TransactionsPage;
