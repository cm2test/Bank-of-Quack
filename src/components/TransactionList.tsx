// src/components/TransactionList.jsx
import React from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "./transactions/DataTable";
import { getColumns, Transaction } from "./transactions/columns";
// import { Transaction } from "../App";

interface TransactionListProps {
  transactions: any[];
  deleteTransaction: (id: string) => void;
  className?: string;
}

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  deleteTransaction,
  className = "",
}) => {
  const {
    userNames,
    handleSetEditingTransaction,
    transactions: allTransactions,
  } = useOutletContext<any>();
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
    <div className={className}>
      {/* Cards for mobile */}
      <div className="block md:hidden space-y-4">
        {sortedTransactions.length === 0 ? (
          <p>No transactions found for the selected period.</p>
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

            return (
              <Card key={t.id} className="p-0">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <div className="font-semibold">
                        {t.description} - ${t.amount.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ({type.charAt(0).toUpperCase() + type.slice(1)})
                      </div>
                      <div className="text-xs mt-1">Date: {t.date}</div>
                      {type === "expense" && (
                        <>
                          <div className="text-xs">
                            Category: {t.category_name || "N/A"}
                          </div>
                          <div className="text-xs">
                            Paid by:{" "}
                            {t.paid_by_user_name === "Shared"
                              ? "Shared"
                              : t.paid_by_user_name || "N/A"}
                          </div>
                          <div className="text-xs">
                            Split: {getSplitTypeLabel(t.split_type || "")}
                          </div>
                        </>
                      )}
                      {type === "settlement" && (
                        <>
                          <div className="text-xs">
                            Payer: {t.paid_by_user_name || "N/A"}
                          </div>
                          <div className="text-xs">
                            Payee: {t.paid_to_user_name || "N/A"}
                          </div>
                        </>
                      )}
                      {(type === "income" || type === "reimbursement") && (
                        <>
                          <div className="text-xs">
                            Category:{" "}
                            {t.category_name
                              ? t.category_name
                              : type === "reimbursement" &&
                                t.reimburses_transaction_id &&
                                allTransactions
                              ? (() => {
                                  const originalExpense = allTransactions.find(
                                    (exp: any) =>
                                      exp.id === t.reimburses_transaction_id
                                  );
                                  return (
                                    originalExpense?.category_name || "N/A"
                                  );
                                })()
                              : "N/A"}
                          </div>
                          <div className="text-xs">
                            Received by: {t.paid_by_user_name || "N/A"}
                          </div>
                          {reimbursedExpenseDescription && (
                            <div className="text-xs text-green-600">
                              Reimburses: "{reimbursedExpenseDescription}"
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex gap-2 mt-2 md:mt-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(t)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteTransaction(t.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
      {/* DataTable for desktop */}
      <div className="hidden md:block">
        <DataTable
          columns={getColumns(userNames)}
          data={sortedTransactions}
          onEdit={onEdit}
          onDelete={deleteTransaction}
        />
      </div>
    </div>
  );
};

export default TransactionList;
