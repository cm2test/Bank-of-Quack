// src/components/dashboard/BalanceSummary.jsx
import React, { useMemo } from "react";
import { useOutletContext } from "react-router-dom";

function BalanceSummary({ transactionsInDateRange }) {
  const { userNames } = useOutletContext();

  const balanceSummary = useMemo(() => {
    if (!userNames || userNames.length < 2) return 0;
    const [user1, user2] = userNames;
    let netBalanceUser1 = 0;

    transactionsInDateRange.forEach((t) => {
      const amount = t.amount;
      if (t.paidBy === user1) {
        if (t.splitType === "splitEqually") netBalanceUser1 += amount / 2;
        else if (t.splitType === "user2_only") netBalanceUser1 += amount;
      } else if (t.paidBy === user2) {
        if (t.splitType === "splitEqually") netBalanceUser1 -= amount / 2;
        else if (t.splitType === "user1_only") netBalanceUser1 -= amount;
      }
    });
    return netBalanceUser1;
  }, [transactionsInDateRange, userNames]);

  const renderBalanceMessage = () => {
    if (!userNames || userNames.length < 2)
      return "Please set user names in Settings.";
    const [user1, user2] = userNames;

    if (balanceSummary === 0) {
      return `${user1} and ${user2} are all square!`;
    } else if (balanceSummary > 0) {
      return `${user2} owes ${user1} $${balanceSummary.toFixed(2)}.`;
    } else {
      return `${user1} owes ${user2} $${Math.abs(balanceSummary).toFixed(2)}.`;
    }
  };

  return (
    <div
      id="whoOwesWhomSection"
      style={{ padding: "10px", border: "1px solid #ccc", margin: "10px 0" }}
    >
      <h3>Balance Summary</h3>
      <p>{renderBalanceMessage()}</p>
    </div>
  );
}

export default BalanceSummary;
