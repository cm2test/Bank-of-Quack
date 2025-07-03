// src/components/dashboard/BalanceSummary.tsx
import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney, cn } from "@/lib/utils";
import { Transaction } from "@/types";
import { Button } from "../ui/button";
import { HelpCircle } from "lucide-react";
import { parseInputDateLocal } from "@/utils/dateUtils";

interface BalanceSummaryProps {
  transactions: Transaction[];
  allTransactions: Transaction[];
  userNames: string[];
  user1AvatarUrl: string | null;
  user2AvatarUrl: string | null;
  showValues?: boolean;
}

const BalanceSummary: React.FC<BalanceSummaryProps> = ({
  transactions,
  allTransactions,
  userNames,
  user1AvatarUrl,
  user2AvatarUrl,
  showValues = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { balanceSummary, calculationSteps } = useMemo(() => {
    if (!userNames || userNames.length < 2 || !transactions) {
      return { balanceSummary: 0, calculationSteps: [] };
    }

    // Exclude reimbursements that reimburse another transaction from the main list
    const effectiveBalanceTransactions: Transaction[] = [
      ...transactions.filter(
        (t) =>
          t.transaction_type !== "reimbursement" || !t.reimburses_transaction_id
      ),
    ];
    const reimbursements = transactions.filter(
      (t) =>
        t.transaction_type === "reimbursement" && t.reimburses_transaction_id
    );

    reimbursements.forEach((reimbursement) => {
      console.log("Processing reimbursement:", reimbursement);
      const originalExpense = allTransactions.find(
        (t) => t.id === reimbursement.reimburses_transaction_id
      );
      if (!originalExpense) {
        console.warn(
          "Original expense not found for reimbursement:",
          reimbursement.id,
          "reimburses_transaction_id:",
          reimbursement.reimburses_transaction_id
        );
      } else if (!originalExpense.split_type) {
        console.warn(
          "Original expense found but missing split_type:",
          originalExpense
        );
      } else {
        // The reimburser is the user who is NOT the original payer
        const [user1, user2] = userNames;
        let reimburser = user1;
        if (originalExpense.paid_by_user_name === user1) {
          reimburser = user2;
        } else {
          reimburser = user1;
        }
        const virtualNegativeExpense: Transaction = {
          ...reimbursement,
          id: `${reimbursement.id}-virtual`,
          transaction_type: "expense",
          amount: -reimbursement.amount,
          split_type: originalExpense.split_type,
          paid_by_user_name: reimbursement.paid_to_user_name,
          paid_to_user_name: null,
          category_id: originalExpense.category_id,
          category_name: originalExpense.category_name,
          description: `(Reimbursement for: ${originalExpense.description})`,
        };
        // Determine beneficiary based on split_type
        let beneficiary: string | null = null;
        if (originalExpense.split_type === "user1_only") beneficiary = user1;
        if (originalExpense.split_type === "user2_only") beneficiary = user2;
        // Only add if paid_by_user_name is not the same as beneficiary
        if (
          !beneficiary ||
          virtualNegativeExpense.paid_by_user_name !== beneficiary
        ) {
          console.log(
            "Created virtual negative expense:",
            virtualNegativeExpense
          );
          effectiveBalanceTransactions.push(virtualNegativeExpense);
        } else {
          console.log(
            "Skipping virtual negative expense (self-reimbursement):",
            virtualNegativeExpense
          );
        }
      }
    });

    console.log(
      "Effective balance transactions:",
      effectiveBalanceTransactions
    );
    // Filter out income transactions and pure reimbursements (those without reimburses_transaction_id)
    const filteredTransactions = effectiveBalanceTransactions.filter((t) => {
      if (t.transaction_type === "income") return false;
      if (
        t.transaction_type === "reimbursement" &&
        !t.reimburses_transaction_id
      )
        return false;
      return true;
    });
    console.log("Filtered transactions:", filteredTransactions);

    const sortedTransactions = [...filteredTransactions].sort((a, b) => {
      const dateA = parseInputDateLocal(a.date);
      const dateB = parseInputDateLocal(b.date);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      const createdAtA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const createdAtB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return createdAtA - createdAtB;
    });
    console.log("Sorted transactions:", sortedTransactions);

    const [user1, user2] = userNames;
    let netBalanceUser1OwesUser2 = 0;
    const steps: any[] = [];

    sortedTransactions.forEach((t) => {
      const amount = t.amount;
      const type = t.transaction_type || "expense";
      let change = 0;
      let explanation = "";

      if (type === "expense") {
        if (t.paid_by_user_name === "Shared") {
          return;
        }
        if (t.paid_by_user_name === user1) {
          if (t.split_type === "splitEqually") {
            change = -amount / 2;
            explanation = `${user2}'s half of a purchase made by ${user1}.`;
          } else if (t.split_type === "user2_only") {
            change = -amount;
            explanation = `${user1} paid for something used only by ${user2}.`;
          } else if (t.split_type === "user1_only" && amount < 0) {
            // Negative expense: user2 reimbursed user1 for user1_only
            change = -amount;
            explanation = `${user1} was reimbursed for something used only by ${user1}.`;
          }
        } else if (t.paid_by_user_name === user2) {
          if (t.split_type === "splitEqually") {
            change = amount / 2;
            explanation = `${user1}'s half of a purchase made by ${user2}.`;
          } else if (t.split_type === "user1_only") {
            change = amount;
            explanation = `${user2} paid for something used only by ${user1}.`;
          } else if (t.split_type === "user2_only" && amount < 0) {
            // Negative expense: user1 reimbursed user2 for user2_only
            change = amount;
            explanation = `${user2} was reimbursed for something used only by ${user2}.`;
          }
        }
      } else if (type === "settlement") {
        if (t.paid_by_user_name === user1 && t.paid_to_user_name === user2) {
          change = -amount;
          explanation = `Settlement paid from ${user1} to ${user2}.`;
        } else if (
          t.paid_by_user_name === user2 &&
          t.paid_to_user_name === user1
        ) {
          change = amount;
          explanation = `Settlement paid from ${user2} to ${user1}.`;
        }
      } else if (type === "income" || type === "reimbursement") {
        if (t.paid_to_user_name === user1) {
          change = amount;
          explanation = `${user1} received ${type}.`;
        } else if (t.paid_to_user_name === user2) {
          change = -amount;
          explanation = `${user2} received ${type}.`;
        }
      }

      if (change !== 0) {
        const newBalance = netBalanceUser1OwesUser2 + change;
        steps.push({
          transaction: t,
          change: change,
          explanation: explanation,
          newBalance: newBalance,
        });
        netBalanceUser1OwesUser2 = newBalance;
      }
    });
    console.log("Final calculationSteps:", steps);
    return {
      balanceSummary: netBalanceUser1OwesUser2,
      calculationSteps: steps,
    };
  }, [transactions, userNames, allTransactions]);

  const [user1, user2] = userNames || ["User 1", "User 2"];

  const UserBadge = ({
    name,
    avatarUrl,
  }: {
    name: string;
    avatarUrl: string | null;
  }) => (
    <div className="inline-flex items-center gap-1.5 bg-muted/20 text-muted-foreground px-2 py-0.5 rounded-md">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={`${name} avatar`}
          className="w-4 h-4 rounded-full object-cover"
        />
      ) : (
        <span className="text-xs">🦆</span>
      )}
      <span className="text-xs font-medium leading-none">{name}</span>
    </div>
  );

  const renderExplanationDetail = (transaction: Transaction) => {
    const {
      transaction_type,
      paid_by_user_name,
      paid_to_user_name,
      split_type,
    } = transaction;

    if (transaction_type === "income" || transaction_type === "reimbursement") {
      if (!paid_to_user_name) return null;
      const receiverName = paid_to_user_name;
      const receiverAvatar =
        receiverName === user1 ? user1AvatarUrl : user2AvatarUrl;
      return (
        <>
          <UserBadge name={receiverName} avatarUrl={receiverAvatar} />
          <span className="text-xs">received</span>
        </>
      );
    }

    if (!paid_by_user_name) return null;

    const payerName = paid_by_user_name;
    const payerAvatar = payerName === user1 ? user1AvatarUrl : user2AvatarUrl;

    if (transaction_type === "settlement") {
      const recipientName = paid_to_user_name!;
      const recipientAvatar =
        recipientName === user1 ? user1AvatarUrl : user2AvatarUrl;
      return (
        <>
          <UserBadge name={payerName} avatarUrl={payerAvatar} />
          <span className="text-xs">paid</span>
          <UserBadge name={recipientName} avatarUrl={recipientAvatar} />
        </>
      );
    }

    if (transaction_type === "expense") {
      let beneficiaryName: string | null = null;
      if (split_type === "user1_only") beneficiaryName = user1;
      if (split_type === "user2_only") beneficiaryName = user2;

      return (
        <>
          <UserBadge name={payerName} avatarUrl={payerAvatar} />
          <span className="text-xs">paid</span>
          {split_type === "splitEqually" && (
            <span className="text-xs font-semibold text-muted-foreground/80">
              , split 50/50
            </span>
          )}
          {beneficiaryName && (
            <>
              <span className="text-xs">for</span>
              <UserBadge
                name={beneficiaryName}
                avatarUrl={
                  beneficiaryName === user1 ? user1AvatarUrl : user2AvatarUrl
                }
              />
            </>
          )}
        </>
      );
    }
    return null;
  };

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

  const renderBalanceLine = (balance: number) => {
    if (Math.abs(balance) < 0.01) {
      return <span className="font-semibold text-green-600">All square!</span>;
    }
    const whoOwes = balance > 0 ? user1 : user2;
    const owesWhom = balance > 0 ? user2 : user1;
    const amount = Math.abs(balance);
    const whoOwesAvatar = whoOwes === user1 ? user1AvatarUrl : user2AvatarUrl;
    const owesWhomAvatar = owesWhom === user1 ? user1AvatarUrl : user2AvatarUrl;

    return (
      <div className="flex items-center justify-end gap-1.5 flex-wrap">
        <UserBadge name={whoOwes} avatarUrl={whoOwesAvatar} />
        <span className="text-xs">owes</span>
        <UserBadge name={owesWhom} avatarUrl={owesWhomAvatar} />
        <strong className="text-sm">{formatMoney(amount)}</strong>
      </div>
    );
  };

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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Balance Summary</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-muted-foreground"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent>
        {isExpanded ? (
          <div className="max-h-96 overflow-y-auto pr-2 -mr-4 space-y-1 scrollbar-hide">
            <div className="pt-2">
              {calculationSteps.length > 0 ? (
                calculationSteps.map((step, index) => (
                  <div
                    key={step.transaction.id + "-" + index}
                    className="grid grid-cols-[auto_1fr] md:grid-cols-[auto_1fr_auto] gap-x-3 items-start text-sm py-4 border-b border-white/40 last:border-b-0"
                  >
                    <div className="text-muted-foreground whitespace-nowrap pt-px">
                      {parseInputDateLocal(
                        step.transaction.date
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <div>
                      <p className="font-medium leading-tight">
                        {step.transaction.description}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                        {renderExplanationDetail(step.transaction)}
                      </div>
                      <div className="flex items-baseline gap-2 mt-1.5">
                        <p className="font-semibold text-sm text-foreground">
                          {formatMoney(step.transaction.amount)}
                        </p>
                      </div>
                    </div>
                    <div className="col-span-2 md:col-span-1 flex items-center justify-end">
                      {renderBalanceLine(step.newBalance)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No transactions affecting the balance in this period.
                </p>
              )}
            </div>
          </div>
        ) : (
          content
        )}
      </CardContent>
    </Card>
  );
};

export default BalanceSummary;
