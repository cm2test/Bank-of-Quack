// src/components/dashboard/TotalExpensesWidget.tsx
import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOutletContext } from "react-router-dom";

interface TotalExpensesWidgetProps {
  transactionsInDateRange: any[];
}

const TotalExpensesWidget: React.FC<TotalExpensesWidgetProps> = ({
  transactionsInDateRange,
}) => {
  const context = useOutletContext<any>();
  const userNames = context?.userNames || [];
  const personInvolvementFilter = context?.personInvolvementFilter || {
    user1: true,
    user2: true,
  };

  const totalNetExpenses = useMemo(() => {
    if (!transactionsInDateRange || userNames.length < 2) {
      // If not enough users, just sum all expenses
      return transactionsInDateRange
        ? transactionsInDateRange
            .filter((t) => t.transaction_type === "expense")
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
      .filter((t) => t.transaction_type === "expense")
      .reduce((sum, t) => {
        const splitType = t.split_type;
        if (t.paid_by_user_name === "Shared") {
          // Shared paid, only include in bothOrNeither (combined) view
          if (bothOrNeither) {
            return sum + (t.amount || 0);
          } else {
            return sum;
          }
        }
        if (onlyUser1) {
          if (splitType === "user1_only") return sum + (t.amount || 0);
          if (splitType === "splitEqually") return sum + (t.amount || 0) / 2;
          return sum; // skip user2_only
        } else if (onlyUser2) {
          if (splitType === "user2_only") return sum + (t.amount || 0);
          if (splitType === "splitEqually") return sum + (t.amount || 0) / 2;
          return sum; // skip user1_only
        } else if (bothOrNeither) {
          return sum + (t.amount || 0);
        }
        return sum;
      }, 0);
  }, [transactionsInDateRange, userNames, personInvolvementFilter]);

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Total Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">${totalNetExpenses.toFixed(2)}</p>
      </CardContent>
    </Card>
  );
};

export default TotalExpensesWidget;
