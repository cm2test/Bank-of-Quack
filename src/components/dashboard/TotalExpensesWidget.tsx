// src/components/dashboard/TotalExpensesWidget.tsx
import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOutletContext } from "react-router-dom";
import { formatMoney } from "@/lib/utils";
import {
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

interface ExpensesIncomeNetWidgetProps {
  transactionsInDateRange: any[];
  context?: any;
  showValues?: boolean;
}

function getPreviousMonthRange() {
  const now = new Date();
  const firstDayPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDayPrevMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    0,
    23,
    59,
    59,
    999
  );
  return [firstDayPrevMonth, lastDayPrevMonth];
}

const ExpensesIncomeNetWidget: React.FC<ExpensesIncomeNetWidgetProps> = ({
  transactionsInDateRange,
  context: propContext,
  showValues = true,
}) => {
  // Use propContext if provided, otherwise fallback to useOutletContext
  const context = propContext || useOutletContext<any>();
  const userNames = context?.userNames || [];
  const personInvolvementFilter = context?.personInvolvementFilter || {
    user1: true,
    user2: true,
  };
  const allTransactions = context?.allTransactions || [];

  // Calculate total expenses (match logic in expensesForWidgets)
  const totalNetExpenses = useMemo(() => {
    if (!transactionsInDateRange || !userNames || userNames.length < 2)
      return 0;
    const onlyUser1 =
      personInvolvementFilter.user1 && !personInvolvementFilter.user2;
    const onlyUser2 =
      personInvolvementFilter.user2 && !personInvolvementFilter.user1;
    const bothUsers =
      personInvolvementFilter.user1 && personInvolvementFilter.user2;
    const shared = personInvolvementFilter.shared;
    return transactionsInDateRange
      .filter((t) => t.transaction_type === "expense")
      .map((expense) => {
        if (
          expense.split_type === "user1_only" &&
          personInvolvementFilter.user1
        ) {
          return expense.amount || 0;
        }
        if (
          expense.split_type === "user2_only" &&
          personInvolvementFilter.user2
        ) {
          return expense.amount || 0;
        }
        if (expense.split_type === "splitEqually" && shared) {
          if (onlyUser1 || onlyUser2) {
            return (expense.amount || 0) / 2;
          }
          // both users or only shared checked
          return expense.amount || 0;
        }
        return 0;
      })
      .reduce((sum, amt) => sum + amt, 0);
  }, [transactionsInDateRange, personInvolvementFilter, userNames]);

  // Calculate total income
  const totalIncome = useMemo(() => {
    if (!transactionsInDateRange || userNames.length < 2) {
      return transactionsInDateRange
        ? transactionsInDateRange
            .filter((t) => t.transaction_type === "income")
            .reduce((sum, t) => sum + (t.amount || 0), 0)
        : 0;
    }
    const onlyUser1 =
      personInvolvementFilter.user1 && !personInvolvementFilter.user2;
    const onlyUser2 =
      personInvolvementFilter.user2 && !personInvolvementFilter.user1;
    const bothOrNeither =
      (personInvolvementFilter.user1 && personInvolvementFilter.user2) ||
      (!personInvolvementFilter.user1 && !personInvolvementFilter.user2);
    return transactionsInDateRange
      .filter((t) => t.transaction_type === "income")
      .reduce((sum, t) => {
        if (t.paid_by_user_name === "Shared") {
          if (bothOrNeither) {
            return sum + (t.amount || 0);
          } else {
            return sum + (t.amount || 0) / 2;
          }
        }
        if (onlyUser1) {
          if (t.paid_by_user_name === userNames[0])
            return sum + (t.amount || 0);
          return sum;
        } else if (onlyUser2) {
          if (t.paid_by_user_name === userNames[1])
            return sum + (t.amount || 0);
          return sum;
        } else if (bothOrNeither) {
          return sum + (t.amount || 0);
        }
        return sum;
      }, 0);
  }, [transactionsInDateRange, userNames, personInvolvementFilter]);

  // Net saved = income - expenses
  const netSaved = totalIncome - totalNetExpenses;

  // --- UI ---
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
