// src/components/dashboard/CategoryBreakdownWidget.jsx
import React, { useMemo } from "react";

function CategoryBreakdownWidget({ transactionsInDateRange }) {
  // This prop is now 'expensesForWidgets' from DashboardPage
  const categoryBreakdown = useMemo(() => {
    if (!transactionsInDateRange) return [];

    // The incoming list (expensesForWidgets) is already:
    // 1. Filtered for transaction_type === 'expense'.
    // 2. Amounts are net of linked reimbursements.
    // 3. Amounts are adjusted (e.g., halved) if a single person filter is active.

    const netCategoryAmounts = transactionsInDateRange.reduce((acc, t) => {
      // Use the original category name (before any reimbursement linking might have altered it for display)
      const category =
        t.category_name_for_reimbursement_logic ||
        t.category_name ||
        "Uncategorized";
      const amount = t.amount || 0; // This is the final amount for this user's view

      acc[category] = (acc[category] || 0) + amount;
      return acc;
    }, {});

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
  }, [transactionsInDateRange]);

  return (
    <div
      id="categoryBreakdownSection"
      style={{ padding: "10px", border: "1px solid #ccc", margin: "10px 0" }}
    >
      <h3>Expenses by Category</h3>
      {categoryBreakdown.length === 0 ? (
        <p>No expenses in this period to categorize.</p>
      ) : (
        <ul style={{ listStyleType: "none", padding: 0 }}>
          {categoryBreakdown.map(
            (item) =>
              item.amount !== 0 && (
                <li key={item.category} style={{ marginBottom: "5px" }}>
                  {item.category}: ${item.amount.toFixed(2)}
                  {item.percentage !== 0 && ` (${item.percentage.toFixed(1)}%)`}
                </li>
              )
          )}
        </ul>
      )}
    </div>
  );
}

export default CategoryBreakdownWidget;
