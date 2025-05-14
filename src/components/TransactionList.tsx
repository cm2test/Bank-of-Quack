// src/components/TransactionList.jsx
import React from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { Transaction } from "../App";

interface TransactionListProps {
  transactions: Transaction[];
}

interface TransactionListContext {
  userNames: string[];
  deleteTransaction: (id: string) => void;
  handleSetEditingTransaction: (t: Transaction) => void;
  transactions: Transaction[];
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions }) => {
  const {
    userNames,
    deleteTransaction,
    handleSetEditingTransaction,
    transactions: allTransactions,
  } = useOutletContext<TransactionListContext>();
  const navigate = useNavigate();

  const getSplitTypeLabel = (splitTypeParam: string) => {
    if (!userNames || userNames.length < 2) {
      switch (splitTypeParam) {
        case "splitEqually":
          return "Split Equally";
        case "user1_only":
          return "For User 1 Only";
        case "user2_only":
          return "For User 2 Only";
        default:
          return splitTypeParam || "N/A";
      }
    }
    switch (splitTypeParam) {
      case "splitEqually":
        return `Split Equally`;
      case "user1_only":
        return `For ${userNames[0]} Only`;
      case "user2_only":
        return `For ${userNames[1]} Only`;
      default:
        return splitTypeParam || "N/A";
    }
  };

  const onEdit = (transaction: Transaction) => {
    handleSetEditingTransaction(transaction);
    navigate("/transactions");
  };
  const onDelete = (transactionId: string) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      deleteTransaction(transactionId);
    }
  };

  if (!transactions || transactions.length === 0) {
    return <p>No transactions found for the selected period.</p>;
  }

  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div>
      <ul style={{ listStyleType: "none", padding: 0 }}>
        {sortedTransactions.map((t) => {
          const type = t.transaction_type || "expense";
          let reimbursedExpenseDescription = null;
          if (
            type === "reimbursement" &&
            t.reimburses_transaction_id &&
            allTransactions
          ) {
            const originalExpense = allTransactions.find(
              (exp) => exp.id === t.reimburses_transaction_id
            );
            if (originalExpense) {
              reimbursedExpenseDescription = originalExpense.description;
            }
          }

          return (
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
                <em
                  style={{
                    marginLeft: "10px",
                    fontSize: "0.9em",
                    color: "#555",
                  }}
                >
                  ({type.charAt(0).toUpperCase() + type.slice(1)})
                </em>
              </div>
              <small>Date: {t.date}</small>
              <br />

              {type === "expense" && (
                <>
                  <small>Category: {t.category_name || "N/A"}</small>
                  <br />
                  <small>Paid by: {t.paid_by_user_name || "N/A"}</small>
                  <br />
                  <small>Split: {getSplitTypeLabel(t.split_type || "")}</small>
                </>
              )}
              {type === "settlement" && (
                <>
                  <small>Payer: {t.paid_by_user_name || "N/A"}</small>
                  <br />
                  <small>Payee: {t.paid_to_user_name || "N/A"}</small>
                </>
              )}
              {(type === "income" || type === "reimbursement") && (
                <>
                  <small>Category: N/A</small>
                  <br />
                  <small>Received by: {t.paid_by_user_name || "N/A"}</small>
                  {reimbursedExpenseDescription && (
                    <>
                      <br />
                      <small style={{ color: "green" }}>
                        Reimburses: "{reimbursedExpenseDescription}"
                      </small>
                    </>
                  )}
                </>
              )}
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
          );
        })}
      </ul>
    </div>
  );
};

export default TransactionList;
