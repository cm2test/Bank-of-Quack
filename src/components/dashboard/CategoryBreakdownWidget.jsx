// src/components/dashboard/CategoryBreakdownWidget.jsx
import React, { useMemo } from "react";

function CategoryBreakdownWidget({ transactionsInDateRange, totalExpenses }) {
  const categoryBreakdown = useMemo(() => {
    if (!transactionsInDateRange) return [];
    const breakdown = {};
    transactionsInDateRange.forEach((t) => {
      // Use database column name: category_name
      const category = t.category_name || "Uncategorized"; // Fallback for safety
      if (breakdown[category]) {
        breakdown[category] += t.amount;
      } else {
        breakdown[category] = t.amount;
      }
    });

    return Object.entries(breakdown)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactionsInDateRange, totalExpenses]);

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
          {categoryBreakdown.map((item) => (
            <li key={item.category} style={{ marginBottom: "5px" }}>
              {item.category}: ${item.amount.toFixed(2)} (
              {item.percentage.toFixed(1)}%)
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CategoryBreakdownWidget;
