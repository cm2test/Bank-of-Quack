// src/components/TransactionList.jsx
import React from "react";
import { useOutletContext, useNavigate } from "react-router-dom"; // Import useNavigate

function TransactionList({ transactions }) {
  const { userNames, deleteTransaction, handleSetEditingTransaction } =
    useOutletContext();
  const navigate = useNavigate(); // Hook for navigation

  const getSplitTypeLabel = (splitType) => {
    if (!userNames || userNames.length < 2) {
      switch (splitType) {
        case "splitEqually":
          return "Split Equally";
        case "user1_only":
          return "For User 1 Only";
        case "user2_only":
          return "For User 2 Only";
        default:
          return splitType;
      }
    }
    switch (splitType) {
      case "splitEqually":
        return "Split Equally";
      case "user1_only":
        return `For ${userNames[0]} Only`;
      case "user2_only":
        return `For ${userNames[1]} Only`;
      default:
        return splitType;
    }
  };

  const onEdit = (transaction) => {
    handleSetEditingTransaction(transaction); // Set the transaction to be edited in App's state
    navigate("/transactions"); // Navigate to the page with the TransactionForm
  };

  const onDelete = (transactionId) => {
    // Optional: Add a confirmation dialog
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      deleteTransaction(transactionId);
    }
  };

  if (!transactions || transactions.length === 0) {
    return <p>No transactions found for the selected period.</p>;
  }

  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  return (
    <div>
      <ul style={{ listStyleType: "none", padding: 0 }}>
        {sortedTransactions.map((t) => (
          <li
            key={t.id}
            style={{
              border: "1px solid #eee",
              padding: "10px",
              marginBottom: "10px",
            }}
          >
            <div>
              <strong>{t.description}</strong> - ${t.amount.toFixed(2)}
            </div>
            <small>Date: {t.date}</small>
            <br />
            <small>Category: {t.category}</small>
            <br />
            <small>Paid by: {t.paidBy}</small>
            <br />
            <small>Split: {getSplitTypeLabel(t.splitType)}</small>
            <div style={{ marginTop: "5px" }}>
              <button onClick={() => onEdit(t)} style={{ marginRight: "5px" }}>
                Edit
              </button>
              <button onClick={() => onDelete(t.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TransactionList;
