// src/App.jsx
import { Outlet, Link } from "react-router-dom";
import { useState, useCallback } from "react";
import "./App.css";

function App() {
  const [transactions, setTransactions] = useState([]);
  const [userNames, setUserNames] = useState(["User 1", "User 2"]);
  const [categories, setCategories] = useState([
    "Food",
    "Transport",
    "Entertainment",
    "Utilities",
    "Uncategorized",
  ]);

  // State to hold the transaction currently being edited
  const [editingTransaction, setEditingTransaction] = useState(null); // null if not editing

  const addTransaction = useCallback((newTransaction) => {
    setTransactions((prevTransactions) => [
      { ...newTransaction, id: Date.now().toString() }, // Ensure new transactions get a unique ID
      ...prevTransactions,
    ]);
  }, []);

  const updateUserNames = useCallback((newUser1Name, newUser2Name) => {
    setUserNames([newUser1Name, newUser2Name]);
  }, []);

  const addCategory = useCallback(
    (newCategory) => {
      if (newCategory && !categories.includes(newCategory)) {
        setCategories((prevCategories) =>
          [...prevCategories, newCategory].sort()
        );
      }
    },
    [categories]
  );

  const deleteCategory = useCallback((categoryToDelete) => {
    setCategories((prevCategories) =>
      prevCategories.filter((cat) => cat !== categoryToDelete)
    );
  }, []);

  // Function to delete a transaction by its ID
  const deleteTransaction = useCallback((transactionId) => {
    setTransactions((prevTransactions) =>
      prevTransactions.filter((transaction) => transaction.id !== transactionId)
    );
  }, []);

  // Function to update an existing transaction
  const updateTransaction = useCallback((updatedTransaction) => {
    setTransactions((prevTransactions) =>
      prevTransactions.map((transaction) =>
        transaction.id === updatedTransaction.id
          ? updatedTransaction
          : transaction
      )
    );
    setEditingTransaction(null); // Clear editing state after update
  }, []);

  // Function to set the transaction to be edited (or clear it)
  // This will be called from TransactionList when an "Edit" button is clicked
  const handleSetEditingTransaction = useCallback((transaction) => {
    setEditingTransaction(transaction);
    // Navigation to the form page will be handled in TransactionList
  }, []);

  const contextValue = {
    transactions,
    addTransaction,
    userNames,
    updateUserNames,
    categories,
    addCategory,
    deleteCategory,
    editingTransaction, // Pass the transaction being edited
    handleSetEditingTransaction, // Pass the function to set it
    updateTransaction, // Pass the update function
    deleteTransaction, // Pass the delete function
  };

  return (
    <>
      <nav>
        <ul>
          <li>
            <Link to="/">Dashboard</Link>
          </li>
          <li>
            <Link to="/transactions">Transactions</Link>
          </li>
          <li>
            <Link to="/settings">Settings</Link>
          </li>
        </ul>
      </nav>
      <hr />
      <main>
        <Outlet context={contextValue} />
      </main>
    </>
  );
}

export default App;
