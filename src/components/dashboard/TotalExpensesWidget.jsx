// src/components/dashboard/TotalExpensesWidget.jsx
import React, { useMemo } from "react";

function TotalExpensesWidget({ transactionsInDateRange }) {
  const totalExpenses = useMemo(() => {
    return transactionsInDateRange.reduce((sum, t) => sum + t.amount, 0);
  }, [transactionsInDateRange]);

  return (
    <div
      id="totalExpensesSection"
      style={{ padding: "10px", border: "1px solid #ccc", margin: "10px 0" }}
    >
      <h3>Total Combined Expenses</h3>
      <p>${totalExpenses.toFixed(2)}</p>
    </div>
  );
}

export default TotalExpensesWidget;
