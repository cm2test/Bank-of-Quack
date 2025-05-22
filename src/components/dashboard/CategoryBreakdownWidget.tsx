// src/components/dashboard/CategoryBreakdownWidget.tsx
import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOutletContext } from "react-router-dom";
import { formatMoney } from "@/lib/utils";

interface CategoryBreakdownWidgetProps {
  transactionsInDateRange: any[];
}

const CategoryBreakdownWidget: React.FC<CategoryBreakdownWidgetProps> = ({
  transactionsInDateRange,
}) => {
  const context = useOutletContext<any>();
  const userNames = context?.userNames || [];
  const personInvolvementFilter = context?.personInvolvementFilter || {
    user1: true,
    user2: true,
  };

  const categoryBreakdown = useMemo(() => {
    if (!transactionsInDateRange || userNames.length < 2) {
      // If not enough users, just sum all expenses by category
      const netCategoryAmounts: Record<string, number> = transactionsInDateRange
        ? transactionsInDateRange
            .filter((t) => t.transaction_type === "expense")
            .reduce((acc, t) => {
              const category =
                (t as any).category_name_for_reimbursement_logic ||
                t.category_name ||
                "Uncategorized";
              const amount = t.amount || 0;
              acc[category] = (acc[category] || 0) + amount;
              return acc;
            }, {} as Record<string, number>)
        : {};
      const totalNetDisplayExpenses = Object.values(netCategoryAmounts).reduce(
        (sum, amount) => sum + amount,
        0
      );
      return Object.entries(netCategoryAmounts)
        .map(([category, amount]) => ({
          category,
          amount,
          percentage:
            totalNetDisplayExpenses > 0
              ? (amount / totalNetDisplayExpenses) * 100
              : 0,
        }))
        .sort((a, b) => b.amount - a.amount);
    }
    const onlyUser1 =
      personInvolvementFilter.user1 && !personInvolvementFilter.user2;
    const onlyUser2 =
      personInvolvementFilter.user2 && !personInvolvementFilter.user1;
    const bothOrNeither =
      (personInvolvementFilter.user1 && personInvolvementFilter.user2) ||
      (!personInvolvementFilter.user1 && !personInvolvementFilter.user2);
    const netCategoryAmounts: Record<string, number> = transactionsInDateRange
      .filter((t) => t.transaction_type === "expense")
      .reduce((acc, t) => {
        const splitType = t.split_type;
        const category =
          (t as any).category_name_for_reimbursement_logic ||
          t.category_name ||
          "Uncategorized";
        let amount = t.amount || 0;
        if (t.paid_by_user_name === "Shared") {
          // Only include in bothOrNeither (combined) view
          if (!bothOrNeither) {
            amount = 0;
          }
        } else if (onlyUser1) {
          if (splitType === "user1_only") {
            // amount stays as is
          } else if (splitType === "splitEqually") {
            amount = amount / 2;
          } else if (splitType === "user2_only") {
            amount = 0;
          }
        } else if (onlyUser2) {
          if (splitType === "user2_only") {
            // amount stays as is
          } else if (splitType === "splitEqually") {
            amount = amount / 2;
          } else if (splitType === "user1_only") {
            amount = 0;
          }
        } else if (bothOrNeither) {
          // amount stays as is
        }
        acc[category] = (acc[category] || 0) + amount;
        return acc;
      }, {} as Record<string, number>);
    const totalNetDisplayExpenses = Object.values(netCategoryAmounts).reduce(
      (sum, amount) => sum + amount,
      0
    );
    return Object.entries(netCategoryAmounts)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage:
          totalNetDisplayExpenses > 0
            ? (amount / totalNetDisplayExpenses) * 100
            : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactionsInDateRange, userNames, personInvolvementFilter]);

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Category Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        {categoryBreakdown.length === 0 ? (
          <p className="text-muted-foreground">No expenses to show.</p>
        ) : (
          <ul className="space-y-1">
            {categoryBreakdown.map((item) => (
              <li key={item.category} className="flex justify-between">
                <span>{item.category}</span>
                <span>
                  {formatMoney(item.amount)}
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({item.percentage.toFixed(1)}%)
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoryBreakdownWidget;
