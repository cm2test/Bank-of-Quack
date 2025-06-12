// src/components/dashboard/BalanceSummary.jsx
import React, { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { formatMoney } from "@/lib/utils";

interface BalanceSummaryProps {
  transactionsInDateRange: any[];
  showValues?: boolean;
}

const BalanceSummary: React.FC<BalanceSummaryProps> = ({
  transactionsInDateRange,
  showValues = true,
}) => {
  const { userNames, user1AvatarUrl, user2AvatarUrl } = useOutletContext<any>();

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

  const [user1, user2] = userNames || ["User 1", "User 2"];

  // Helper to render user avatar + name
  const renderUser = (avatarUrl: string | null, name: string) => (
    <div className="flex flex-col items-center mx-2">
      <div className="w-14 h-14 rounded-full bg-muted-foreground/10 flex items-center justify-center overflow-hidden border">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name + " avatar"}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-2xl text-muted-foreground">🦆</span>
        )}
      </div>
      <span className="mt-1 text-sm font-medium text-center max-w-[80px] truncate">
        {name}
      </span>
    </div>
  );

  let content;
  if (!userNames || userNames.length < 2) {
    content = <span>Please set user names in Settings.</span>;
  } else if (Math.abs(balanceSummary) < 0.01) {
    content = (
      <div className="flex items-center justify-center gap-4 flex-wrap">
        {renderUser(user1AvatarUrl, user1)}
        <span className="text-lg font-semibold">and</span>
        {renderUser(user2AvatarUrl, user2)}
        <span className="text-lg font-semibold">are all square!</span>
      </div>
    );
  } else if (balanceSummary > 0) {
    content = (
      <div className="flex items-center justify-center gap-4 flex-wrap">
        {renderUser(user1AvatarUrl, user1)}
        <span className="text-lg font-semibold">owes</span>
        {renderUser(user2AvatarUrl, user2)}
        <span className="text-lg font-semibold">
          {showValues ? formatMoney(balanceSummary) : "•••••"}
        </span>
      </div>
    );
  } else {
    content = (
      <div className="flex items-center justify-center gap-4 flex-wrap">
        {renderUser(user2AvatarUrl, user2)}
        <span className="text-lg font-semibold">owes</span>
        {renderUser(user1AvatarUrl, user1)}
        <span className="text-lg font-semibold">
          {showValues ? formatMoney(Math.abs(balanceSummary)) : "•••••"}
        </span>
      </div>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Balance Summary</CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
};

export default BalanceSummary;
