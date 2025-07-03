// src/components/dashboard/TotalExpensesWidget.tsx
import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";
import { Transaction } from "@/types";
import { TrendingDown, Wallet, PiggyBank } from "lucide-react";

interface ExpensesIncomeNetWidgetProps {
  transactions: Transaction[];
  allTransactions?: Transaction[];
  userNames: string[];
  showValues?: boolean;
  personInvolvementFilter: { user1: boolean; user2: boolean; shared: boolean };
  hideIncome?: boolean;
  blurSummary?: boolean;
}

const ExpensesIncomeNetWidget: React.FC<ExpensesIncomeNetWidgetProps> = ({
  transactions,
  allTransactions,
  userNames,
  showValues = true,
  personInvolvementFilter,
  hideIncome = false,
  blurSummary = false,
}) => {
  const { totalNetExpenses, totalIncome } = useMemo(() => {
    const sourceTransactions = allTransactions || transactions;
    const expenseTransactions = transactions.filter(
      (t) => t.transaction_type === "expense"
    );

    const findReimbursementsForExpense = (expenseId: string) => {
      return sourceTransactions
        .filter(
          (t) =>
            t.transaction_type === "reimbursement" &&
            t.reimburses_transaction_id === expenseId
        )
        .reduce((sum, r) => sum + r.amount, 0);
    };

    let expenses = 0;

    const onlyUser1Selected =
      personInvolvementFilter.user1 &&
      !personInvolvementFilter.user2 &&
      personInvolvementFilter.shared;
    const onlyUser2Selected =
      !personInvolvementFilter.user1 &&
      personInvolvementFilter.user2 &&
      personInvolvementFilter.shared;

    if (onlyUser1Selected) {
      expenses = expenseTransactions.reduce((sum, t) => {
        const reimbursedAmount = findReimbursementsForExpense(t.id);
        let userExpense = 0;
        if (t.split_type === "user1_only") {
          userExpense = t.amount;
        } else if (t.split_type === "splitEqually") {
          userExpense = t.amount / 2;
        }
        return sum + Math.max(0, userExpense - reimbursedAmount);
      }, 0);
    } else if (onlyUser2Selected) {
      expenses = expenseTransactions.reduce((sum, t) => {
        const reimbursedAmount = findReimbursementsForExpense(t.id);
        let userExpense = 0;
        if (t.split_type === "user2_only") {
          userExpense = t.amount;
        } else if (t.split_type === "splitEqually") {
          userExpense = t.amount / 2;
        }
        return sum + Math.max(0, userExpense - reimbursedAmount);
      }, 0);
    } else {
      expenses = expenseTransactions.reduce((sum, t) => {
        const reimbursedAmount = findReimbursementsForExpense(t.id);
        return sum + Math.max(0, t.amount - reimbursedAmount);
      }, 0);
    }

    const income = transactions
      .filter(
        (t) =>
          t.transaction_type === "income" ||
          (t.transaction_type === "reimbursement" &&
            !t.reimburses_transaction_id)
      )
      .reduce((sum, t) => sum + t.amount, 0);

    return { totalNetExpenses: expenses, totalIncome: income };
  }, [transactions, allTransactions, personInvolvementFilter, userNames]);

  const netSaved = totalIncome - totalNetExpenses;

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`grid grid-cols-1 sm:grid-cols-${
            hideIncome ? 1 : 3
          } gap-6 w-full`}
        >
          {/* Expenses */}
          <div className="flex flex-col items-center justify-center bg-destructive/10 rounded-xl p-3 sm:p-6 h-full w-full">
            <TrendingDown className="text-destructive mb-1 sm:mb-2 w-7 h-7 sm:w-9 sm:h-9" />
            <span className="text-muted-foreground text-sm sm:text-base font-medium mb-0.5 sm:mb-1">
              Total Expenses
            </span>
            <span
              className={`text-2xl sm:text-3xl font-extrabold text-destructive${
                blurSummary ? " blur-sm" : ""
              }`}
            >
              {showValues ? formatMoney(totalNetExpenses) : "•••••"}
            </span>
          </div>
          {/* Income */}
          {!hideIncome && (
            <div className="flex flex-col items-center justify-center bg-green-100 dark:bg-green-900/20 rounded-xl p-3 sm:p-6 h-full w-full">
              <Wallet className="text-green-600 mb-1 sm:mb-2 w-7 h-7 sm:w-9 sm:h-9" />
              <span className="text-muted-foreground text-sm sm:text-base font-medium mb-0.5 sm:mb-1">
                Total Income
              </span>
              <span
                className={`text-2xl sm:text-3xl font-extrabold text-green-600${
                  blurSummary ? " blur-sm" : ""
                }`}
              >
                {showValues ? formatMoney(totalIncome) : "•••••"}
              </span>
            </div>
          )}
          {/* Net Saved */}
          {!hideIncome && (
            <div className="flex flex-col items-center justify-center bg-primary/10 rounded-xl p-3 sm:p-6 h-full w-full">
              <PiggyBank className="text-primary mb-1 sm:mb-2 w-7 h-7 sm:w-9 sm:h-9" />
              <span className="text-muted-foreground text-sm sm:text-base font-medium mb-0.5 sm:mb-1">
                Net Saved
              </span>
              <span
                className={`text-2xl sm:text-3xl font-extrabold ${
                  netSaved >= 0 ? "text-primary" : "text-destructive"
                }${blurSummary ? " blur-sm" : ""}`}
              >
                {showValues ? formatMoney(netSaved) : "•••••"}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpensesIncomeNetWidget;
