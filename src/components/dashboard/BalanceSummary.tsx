// src/components/dashboard/BalanceSummary.jsx
import React, { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { Transaction } from "../../App";

interface BalanceSummaryProps {
  transactionsInDateRange: Transaction[];
}

interface BalanceSummaryContext {
  userNames: string[];
}

const BalanceSummary: React.FC<BalanceSummaryProps> = ({
  transactionsInDateRange,
}) => {
  const { userNames } = useOutletContext<BalanceSummaryContext>();

  const balanceSummary = useMemo(() => {
    if (!userNames || userNames.length < 2 || !transactionsInDateRange)
      return 0;

    const [user1, user2] = userNames;
    let netBalanceUser1OwesUser2 = 0; // Positive: user1 owes user2. Negative: user2 owes user1.

    transactionsInDateRange.forEach((t) => {
      const amount = t.amount;
      const type = t.transaction_type || "expense"; // Default to 'expense' if undefined

      if (type === "expense") {
        if (t.paid_by_user_name === user1) {
          if (t.split_type === "splitEqually") {
            netBalanceUser1OwesUser2 -= amount / 2;
          } else if (t.split_type === "user2_only") {
            netBalanceUser1OwesUser2 -= amount;
          }
        } else if (t.paid_by_user_name === user2) {
          if (t.split_type === "splitEqually") {
            netBalanceUser1OwesUser2 += amount / 2;
          } else if (t.split_type === "user1_only") {
            netBalanceUser1OwesUser2 += amount;
          }
        }
      } else if (type === "settlement") {
        if (t.paid_by_user_name === user1 && t.paid_to_user_name === user2) {
          netBalanceUser1OwesUser2 -= amount;
        } else if (
          t.paid_by_user_name === user2 &&
          t.paid_to_user_name === user1
        ) {
          netBalanceUser1OwesUser2 += amount;
        }
      }
      // 'income' and 'reimbursement' types are ignored for this balance calculation
    });
    return netBalanceUser1OwesUser2;
  }, [transactionsInDateRange, userNames]);

  const renderBalanceMessage = () => {
    if (!userNames || userNames.length < 2)
      return "Please set user names in Settings.";
    const [user1, user2] = userNames;

    if (balanceSummary === 0) {
      return `${user1} and ${user2} are all square!`;
    } else if (balanceSummary > 0) {
      return `${user1} owes ${user2} $${balanceSummary.toFixed(2)}.`;
    } else {
      return `${user2} owes ${user1} $${Math.abs(balanceSummary).toFixed(2)}.`;
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
};

export default BalanceSummary;
