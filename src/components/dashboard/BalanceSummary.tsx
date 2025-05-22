// src/components/dashboard/BalanceSummary.jsx
import React, { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { formatMoney } from "@/lib/utils";

interface BalanceSummaryProps {
  transactionsInDateRange: any[];
}

const BalanceSummary: React.FC<BalanceSummaryProps> = ({
  transactionsInDateRange,
}) => {
  const { userNames } = useOutletContext<any>();

  const balanceSummary = useMemo(() => {
    if (!userNames || userNames.length < 2 || !transactionsInDateRange)
      return 0;

    const [user1, user2] = userNames;
    let netBalanceUser1OwesUser2 = 0;

    transactionsInDateRange.forEach((t) => {
      const amount = t.amount;
      const type = t.transaction_type || "expense";

      if (type === "expense") {
        if (t.paid_by_user_name === "Shared") {
          // Shared paid, ignore for balance
          return;
        }
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
      return `${user1} owes ${user2} ${formatMoney(balanceSummary)}.`;
    } else {
      return `${user2} owes ${user1} ${formatMoney(Math.abs(balanceSummary))}.`;
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Balance Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <Alert>{renderBalanceMessage()}</Alert>
      </CardContent>
    </Card>
  );
};

export default BalanceSummary;
