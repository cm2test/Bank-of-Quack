// src/components/dashboard/BalanceSummary.jsx
import React, { useMemo } from "react";
import { useOutletContext } from "react-router-dom";

function BalanceSummary({ transactionsInDateRange }) {
  const { userNames } = useOutletContext(); // userNames are crucial here

  const balanceSummary = useMemo(() => {
    if (!userNames || userNames.length < 2 || !transactionsInDateRange)
      return 0; // Guard clauses

    const [user1, user2] = userNames;
    let netBalanceUser1 = 0; // Positive: user2 owes user1. Negative: user1 owes user2.

    transactionsInDateRange.forEach((t) => {
      const amount = t.amount;
      // Use database column names: paid_by_user_name and split_type
      if (t.paid_by_user_name === user1) {
        if (t.split_type === "splitEqually") {
          netBalanceUser1 += amount / 2;
        } else if (t.split_type === "user2_only") {
          netBalanceUser1 += amount;
        }
      } else if (t.paid_by_user_name === user2) {
        if (t.split_type === "splitEqually") {
          netBalanceUser1 -= amount / 2;
        } else if (t.split_type === "user1_only") {
          netBalanceUser1 -= amount;
        }
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
