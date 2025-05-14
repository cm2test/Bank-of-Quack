// src/components/TransactionList.jsx
import React from "react";
import { useOutletContext, useNavigate } from "react-router-dom";

function TransactionList({ transactions }) {
  // Ensure userNames is destructured here if used, or fetched if needed for labels.
  // For now, deleteTransaction and handleSetEditingTransaction are the primary context needs.
  const { userNames, deleteTransaction, handleSetEditingTransaction } =
    useOutletContext();
  const navigate = useNavigate();

  const getSplitTypeLabel = (splitTypeParam) => {
    // Renamed parameter to avoid conflict
    if (!userNames || userNames.length < 2) {
      // Fallback labels if userNames aren't fully available
      switch (splitTypeParam) {
        case "splitEqually":
          return "Split Equally";
        case "user1_only":
          return "For User 1 Only"; // Generic fallback
        case "user2_only":
          return "For User 2 Only"; // Generic fallback
        default:
          return splitTypeParam;
      }
    }
    // Use dynamic names
    switch (splitTypeParam) {
      case "splitEqually":
        return "Split Equally";
      case "user1_only":
        return `For ${userNames[0]} Only`;
      case "user2_only":
        return `For ${userNames[1]} Only`;
      default:
        return splitTypeParam;
    }
  };

  const onEdit = (transaction) => {
    handleSetEditingTransaction(transaction);
    navigate("/transactions");
  };

  const onDelete = (transactionId) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      deleteTransaction(transactionId);
    }
  };

  if (!transactions || transactions.length === 0) {
    return <p>No transactions found for the selected period.</p>;
  }

  // Assuming transactions are already sorted if needed by the parent component (DashboardPage)
  // const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  // Using transactions directly as passed

  return (
    <div>
      <ul style={{ listStyleType: "none", padding: 0 }}>
        {transactions.map(
          (
            t // Use transactions prop directly
          ) => (
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
              {/* Use database column names */}
              <small>Date: {t.date}</small>
              <br />
              <small>Category: {t.category_name || "N/A"}</small>
              <br />
              <small>Paid by: {t.paid_by_user_name || "N/A"}</small>
              <br />
              <small>Split: {getSplitTypeLabel(t.split_type)}</small>
              <div style={{ marginTop: "5px" }}>
                <button
                  onClick={() => onEdit(t)}
                  style={{ marginRight: "5px" }}
                >
                  Edit
                </button>
                <button onClick={() => onDelete(t.id)}>Delete</button>
              </div>
            </li>
          )
        )}
      </ul>
    </div>
  );
}

export default TransactionList;
