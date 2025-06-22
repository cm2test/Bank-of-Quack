// src/components/dashboard/TotalExpensesWidget.tsx
import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";
import { Transaction } from "@/types";
import { TrendingDown, Wallet, PiggyBank } from "lucide-react";

interface ExpensesIncomeNetWidgetProps {
  transactions: Transaction[];
  userNames: string[];
  showValues?: boolean;
  personInvolvementFilter: { user1: boolean; user2: boolean; shared: boolean };
}

const ExpensesIncomeNetWidget: React.FC<ExpensesIncomeNetWidgetProps> = ({
  transactions,
  userNames,
  showValues = true,
  personInvolvementFilter,
}) => {
  const { totalNetExpenses, totalIncome } = useMemo(() => {
    const expenseTransactions = transactions.filter(
      (t) => t.transaction_type === "expense"
    );
    const reimbursementTransactions = transactions.filter(
      (t) =>
        t.transaction_type === "reimbursement" && t.reimburses_transaction_id
    );

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
        if (t.split_type === "user1_only") return sum + t.amount;
        if (t.split_type === "splitEqually") return sum + t.amount / 2;
        return sum;
      }, 0);
      const user1Reimbursements = reimbursementTransactions
        .filter((r) => r.paid_by_user_name === userNames[0])
        .reduce((sum, r) => sum + r.amount, 0);
      expenses -= user1Reimbursements;
    } else if (onlyUser2Selected) {
      expenses = expenseTransactions.reduce((sum, t) => {
        if (t.split_type === "user2_only") return sum + t.amount;
        if (t.split_type === "splitEqually") return sum + t.amount / 2;
        return sum;
      }, 0);
      const user2Reimbursements = reimbursementTransactions
        .filter((r) => r.paid_by_user_name === userNames[1])
        .reduce((sum, r) => sum + r.amount, 0);
      expenses -= user2Reimbursements;
    } else {
      const totalExpenseAmount = expenseTransactions.reduce(
        (sum, t) => sum + t.amount,
        0
      );
      const totalReimbursementAmount = reimbursementTransactions.reduce(
        (sum, r) => sum + r.amount,
        0
      );
      expenses = totalExpenseAmount - totalReimbursementAmount;
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
  }, [transactions, personInvolvementFilter, userNames]);

  const netSaved = totalIncome - totalNetExpenses;

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
          {/* Expenses */}
          <div className="flex flex-col items-center justify-center bg-destructive/10 rounded-xl p-3 sm:p-6 h-full w-full">
            <TrendingDown className="text-destructive mb-1 sm:mb-2 w-7 h-7 sm:w-9 sm:h-9" />
            <span className="text-muted-foreground text-sm sm:text-base font-medium mb-0.5 sm:mb-1">
              Total Expenses
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-destructive">
              {showValues ? formatMoney(totalNetExpenses) : "•••••"}
            </span>
          </div>
          {/* Income */}
          <div className="flex flex-col items-center justify-center bg-green-100 dark:bg-green-900/20 rounded-xl p-3 sm:p-6 h-full w-full">
            <Wallet className="text-green-600 mb-1 sm:mb-2 w-7 h-7 sm:w-9 sm:h-9" />
            <span className="text-muted-foreground text-sm sm:text-base font-medium mb-0.5 sm:mb-1">
              Total Income
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-green-600">
              {showValues ? formatMoney(totalIncome) : "•••••"}
            </span>
          </div>
          {/* Net Saved */}
          <div className="flex flex-col items-center justify-center bg-primary/10 rounded-xl p-3 sm:p-6 h-full w-full">
            <PiggyBank className="text-primary mb-1 sm:mb-2 w-7 h-7 sm:w-9 sm:h-9" />
            <span className="text-muted-foreground text-sm sm:text-base font-medium mb-0.5 sm:mb-1">
              Net Saved
            </span>
            <span
              className={`text-2xl sm:text-3xl font-extrabold ${
                netSaved >= 0 ? "text-primary" : "text-destructive"
              }`}
            >
              {showValues ? formatMoney(netSaved) : "•••••"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpensesIncomeNetWidget;
