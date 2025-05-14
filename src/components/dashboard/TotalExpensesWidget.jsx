// src/components/dashboard/TotalExpensesWidget.jsx
import React, { useMemo } from "react";

function TotalExpensesWidget({ transactionsInDateRange }) {
  // This prop is now 'expensesForWidgets' from DashboardPage
  const totalNetExpenses = useMemo(() => {
    if (!transactionsInDateRange) return 0;
    // The incoming list is already filtered for expenses and amounts are adjusted for person filter
    return transactionsInDateRange.reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [transactionsInDateRange]);

  return (
    <div
      id="totalExpensesSection"
      style={{ padding: "10px", border: "1px solid #ccc", margin: "10px 0" }}
    >
      <h3>Total Expenses</h3> {/* Can revert title if "Net" is confusing now */}
      <p>${totalNetExpenses.toFixed(2)}</p>
    </div>
  );
}

export default TotalExpensesWidget;
