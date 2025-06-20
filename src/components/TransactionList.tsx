// src/components/TransactionList.jsx
import React, { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "./transactions/DataTable";
import { getColumns, Transaction } from "./transactions/columns";
import { formatMoney } from "@/lib/utils";
// import { Transaction } from "../App";

interface TransactionListProps {
  transactions: any[];
  deleteTransaction: (id: string) => void;
  className?: string;
  showValues?: boolean;
  incomeImageUrl?: string | null;
  settlementImageUrl?: string | null;
  reimbursementImageUrl?: string | null;
  variant?: "default" | "dialog";
}

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  deleteTransaction,
  className = "",
  showValues = true,
  incomeImageUrl,
  settlementImageUrl,
  reimbursementImageUrl,
  variant = "default",
}) => {
  const {
    userNames,
    handleSetEditingTransaction,
    transactions: allTransactions,
    categories = [],
  } = useOutletContext<any>();
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [allExpanded, setAllExpanded] = useState(false);

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
    deleteTransaction(transactionId);
  };

  if (!transactions || transactions.length === 0) {
    return <p>No transactions found for the selected period.</p>;
  }

  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const isDialog = variant === "dialog";

  return (
    <div className={className}>
      {/* Header with Expand/Collapse All button */}
      <div className="flex items-center justify-between mb-2">
        <h2
          className={`text-2xl font-bold ${
            isDialog ? "text-white" : "text-primary"
          }`}
        >
          Transactions
        </h2>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            if (allExpanded) {
              setExpandedId(null);
              setAllExpanded(false);
            } else {
              setExpandedId("ALL");
              setAllExpanded(true);
            }
          }}
          className={`ml-2 ${isDialog ? "text-white hover:bg-white/10" : ""}`}
        >
          {allExpanded ? "Collapse All" : "Expand All"}
        </Button>
      </div>
      {/* Flat list for mobile and desktop */}
      <div className="space-y-2">
        {sortedTransactions.length === 0 ? (
          <p className={isDialog ? "text-gray-300" : ""}>
            No transactions found for the selected period.
          </p>
        ) : (
          sortedTransactions.map((t) => {
            const type = t.transaction_type || "expense";
            let reimbursedExpenseDescription = null;
            if (
              type === "reimbursement" &&
              t.reimburses_transaction_id &&
              allTransactions
            ) {
              const originalExpense = allTransactions.find(
                (exp: any) => exp.id === t.reimburses_transaction_id
              );
              if (originalExpense) {
                reimbursedExpenseDescription = originalExpense.description;
              }
            }
            const isPositive = type === "income" || type === "reimbursement";
            let dateLabel = t.date;
            if (t.time) {
              dateLabel = `${t.time}`;
            }
            // Expanded if allExpanded or expandedId === t.id
            const isExpanded = allExpanded || expandedId === t.id;
            return (
              <div key={t.id}>
                <div
                  className={`bg-background/80 rounded-xl transition-colors cursor-pointer border ${
                    isDialog
                      ? "border-gray-700 hover:bg-white/5"
                      : "border-border"
                  } ${
                    isExpanded ? "ring-2 ring-primary/30" : ""
                  } flex flex-col overflow-hidden animate-fade-in user-select-none focus:outline-none`}
                  onClick={() => {
                    window.getSelection()?.removeAllRanges();
                    if (allExpanded) return; // Don't allow individual collapse if all are expanded
                    setExpandedId(isExpanded ? null : t.id);
                  }}
                >
                  {/* Top row: image, details, amount */}
                  <div className="flex items-center gap-4 px-2 py-3">
                    {/* Category image */}
                    <div className="flex-shrink-0">
                      {(() => {
                        let catImg = null;
                        if (t.category_id) {
                          const cat = categories.find(
                            (c: any) => c.id === t.category_id
                          );
                          if (cat && cat.image_url) {
                            catImg = (
                              <img
                                src={cat.image_url}
                                alt={cat.name}
                                className="w-10 h-10 rounded-xl object-cover bg-white border border-border"
                              />
                            );
                          }
                        }
                        // Show transaction type image if no category image
                        if (!catImg) {
                          if (type === "income" && incomeImageUrl) {
                            return (
                              <img
                                src={incomeImageUrl}
                                alt="Income"
                                className="w-10 h-10 rounded-xl object-contain bg-white border border-border"
                              />
                            );
                          }
                          if (type === "settlement" && settlementImageUrl) {
                            return (
                              <img
                                src={settlementImageUrl}
                                alt="Settlement"
                                className="w-10 h-10 rounded-xl object-contain bg-white border border-border"
                              />
                            );
                          }
                          if (
                            type === "reimbursement" &&
                            reimbursementImageUrl
                          ) {
                            return (
                              <img
                                src={reimbursementImageUrl}
                                alt="Reimbursement"
                                className="w-10 h-10 rounded-xl object-contain bg-white border border-border"
                              />
                            );
                          }
                        }
                        return (
                          catImg || (
                            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground text-lg font-bold">
                              ?
                            </div>
                          )
                        );
                      })()}
                    </div>
                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-base font-semibold truncate ${
                          isDialog ? "text-white" : "text-primary"
                        }`}
                      >
                        {t.description}
                      </div>
                      <div
                        className={`text-xs mt-0.5 ${
                          isDialog ? "text-gray-400" : "text-muted-foreground"
                        }`}
                      >
                        {dateLabel}
                      </div>
                    </div>
                    {/* Amount */}
                    <div className="flex flex-col items-end min-w-[70px]">
                      <span
                        className={`text-lg font-bold ${
                          isPositive ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        {showValues
                          ? `${isPositive ? "+" : "-"}${formatMoney(t.amount)}`
                          : "•••••"}
                      </span>
                    </div>
                  </div>
                  {/* Expanded details and buttons inside the box */}
                  {isExpanded && (
                    <div className="flex flex-col sm:flex-row gap-4 px-6 pb-4 pt-2 animate-fade-in">
                      {/* Details left */}
                      <div
                        className={`flex-1 text-sm space-y-1 ${
                          isDialog ? "text-gray-300" : "text-muted-foreground"
                        }`}
                      >
                        <div>
                          Type: {type.charAt(0).toUpperCase() + type.slice(1)}
                        </div>
                        <div>
                          Category:{" "}
                          {(() => {
                            if (t.category_id) {
                              const cat = categories.find(
                                (c: any) => c.id === t.category_id
                              );
                              return cat ? cat.name : "Uncategorized";
                            }
                            return "Uncategorized";
                          })()}
                        </div>
                        {type === "expense" && (
                          <>
                            <div>Paid by: {t.paid_by_user_name || "N/A"}</div>
                            <div>
                              Split: {getSplitTypeLabel(t.split_type || "")}
                            </div>
                          </>
                        )}
                        {type === "settlement" && (
                          <>
                            <div>Payer: {t.paid_by_user_name || "N/A"}</div>
                            <div>Payee: {t.paid_to_user_name || "N/A"}</div>
                          </>
                        )}
                        {(type === "income" || type === "reimbursement") && (
                          <>
                            <div>
                              Received by: {t.paid_by_user_name || "N/A"}
                            </div>
                            {reimbursedExpenseDescription && (
                              <div className="text-green-600">
                                Reimburses: "{reimbursedExpenseDescription}"
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      {/* Buttons right */}
                      <div className="flex flex-col sm:flex-row gap-2 items-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(t)}
                          className={
                            isDialog
                              ? "bg-transparent text-white border-gray-500 hover:bg-white/10 w-full sm:w-auto"
                              : "w-full sm:w-auto"
                          }
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onDelete(t.id)}
                          className="w-full sm:w-auto"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TransactionList;
