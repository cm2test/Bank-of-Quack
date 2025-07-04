import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ExpensesIncomeNetWidget from "../TotalExpensesWidget";
import type { Transaction } from "@/types";

const userNames = ["Alice", "Bob"];

// Sample transactions
const baseTransactions: Transaction[] = [
  {
    id: "1",
    amount: 100,
    transaction_type: "expense",
    paid_by_user_name: "Alice",
    paid_to_user_name: null,
    split_type: "splitEqually",
    category_id: "cat1",
    category_name: "Food",
    date: "2024-01-01",
    description: "Dinner",
  },
  {
    id: "2",
    amount: 60,
    transaction_type: "expense",
    paid_by_user_name: "Bob",
    paid_to_user_name: null,
    split_type: "user1_only",
    category_id: "cat2",
    category_name: "Transport",
    date: "2024-01-02",
    description: "Taxi",
  },
  {
    id: "3",
    amount: 40,
    transaction_type: "expense",
    paid_by_user_name: "Alice",
    paid_to_user_name: null,
    split_type: "user2_only",
    category_id: "cat3",
    category_name: "Shopping",
    date: "2024-01-03",
    description: "Gift",
  },
  {
    id: "4",
    amount: 200,
    transaction_type: "income",
    paid_by_user_name: null,
    paid_to_user_name: "Alice",
    split_type: null,
    category_id: null,
    category_name: null,
    date: "2024-01-04",
    description: "Salary",
  },
  {
    id: "5",
    amount: 50,
    transaction_type: "reimbursement",
    paid_by_user_name: "Bob",
    paid_to_user_name: "Alice",
    split_type: null,
    category_id: null,
    category_name: null,
    date: "2024-01-05",
    description: "Reimburse for Dinner",
    reimburses_transaction_id: "1",
  },
  {
    id: "6",
    amount: 30,
    transaction_type: "reimbursement",
    paid_by_user_name: "Alice",
    paid_to_user_name: "Bob",
    split_type: null,
    category_id: null,
    category_name: null,
    date: "2024-01-06",
    description: "Reimburse for Taxi",
    reimburses_transaction_id: "2",
  },
  {
    id: "7",
    amount: 80,
    transaction_type: "reimbursement",
    paid_by_user_name: "Bob",
    paid_to_user_name: "Alice",
    split_type: null,
    category_id: null,
    category_name: null,
    date: "2024-01-07",
    description: "Unlinked reimbursement",
    // No reimburses_transaction_id
  },
];

// Reimbursement only in allTransactions
const extraReimbursement: Transaction = {
  id: "8",
  amount: 20,
  transaction_type: "reimbursement",
  paid_by_user_name: "Alice",
  paid_to_user_name: "Bob",
  split_type: null,
  category_id: null,
  category_name: null,
  date: "2024-01-08",
  description: "Late reimbursement for Gift",
  reimburses_transaction_id: "3",
};

const allTransactions = [...baseTransactions, extraReimbursement];

const filterCombos: {
  name: string;
  filter: { user1: boolean; user2: boolean; shared: boolean };
}[] = [
  { name: "all true", filter: { user1: true, user2: true, shared: true } },
  { name: "only user1", filter: { user1: true, user2: false, shared: false } },
  { name: "only user2", filter: { user1: false, user2: true, shared: false } },
  { name: "only shared", filter: { user1: false, user2: false, shared: true } },
  {
    name: "user1 + shared",
    filter: { user1: true, user2: false, shared: true },
  },
  {
    name: "user2 + shared",
    filter: { user1: false, user2: true, shared: true },
  },
  {
    name: "user1 + user2",
    filter: { user1: true, user2: true, shared: false },
  },
  { name: "none", filter: { user1: false, user2: false, shared: false } },
];

function getExpected({
  filter,
}: {
  filter: { user1: boolean; user2: boolean; shared: boolean };
}) {
  // If all filters are false, return 0 for everything
  if (!filter.user1 && !filter.user2 && !filter.shared) {
    return {
      expenses: 0,
      income: 0,
      netSaved: 0,
    };
  }
  // Helper to calculate expected values for each filter combo
  // Expenses
  let expenses = 0;
  const expenseTxs = baseTransactions.filter(
    (t) => t.transaction_type === "expense"
  );
  const findReimbursements = (expenseId: string) =>
    allTransactions
      .filter(
        (t) =>
          t.transaction_type === "reimbursement" &&
          t.reimburses_transaction_id === expenseId
      )
      .reduce((sum, r) => sum + r.amount, 0);

  const onlyUser1Selected = filter.user1 && !filter.user2 && filter.shared;
  const onlyUser2Selected = !filter.user1 && filter.user2 && filter.shared;

  if (onlyUser1Selected) {
    expenses = expenseTxs.reduce((sum, t) => {
      const reimbursed = findReimbursements(t.id);
      let userExpense = 0;
      if (t.split_type === "user1_only") userExpense = t.amount;
      else if (t.split_type === "splitEqually") userExpense = t.amount / 2;
      return sum + Math.max(0, userExpense - reimbursed);
    }, 0);
  } else if (onlyUser2Selected) {
    expenses = expenseTxs.reduce((sum, t) => {
      const reimbursed = findReimbursements(t.id);
      let userExpense = 0;
      if (t.split_type === "user2_only") userExpense = t.amount;
      else if (t.split_type === "splitEqually") userExpense = t.amount / 2;
      return sum + Math.max(0, userExpense - reimbursed);
    }, 0);
  } else if (!filter.user1 && !filter.user2 && !filter.shared) {
    expenses = 0;
  } else {
    expenses = expenseTxs.reduce((sum, t) => {
      const reimbursed = findReimbursements(t.id);
      return sum + Math.max(0, t.amount - reimbursed);
    }, 0);
  }

  // Income
  const income = baseTransactions
    .filter(
      (t) =>
        t.transaction_type === "income" ||
        (t.transaction_type === "reimbursement" && !t.reimburses_transaction_id)
    )
    .reduce((sum, t) => sum + t.amount, 0);

  // Net saved
  const netSaved = income - expenses;

  return {
    expenses,
    income,
    netSaved,
  };
}

describe("ExpensesIncomeNetWidget - all filter combinations", () => {
  filterCombos.forEach(({ name, filter }) => {
    it(`renders correct values for filter: ${name}`, () => {
      const expected = getExpected({ filter });
      const txs = name === "none" ? [] : baseTransactions;
      console.log("\nScenario:", {
        filter,
        transactions: txs,
      });
      console.log("Expected output:", expected);
      render(
        <ExpensesIncomeNetWidget
          transactions={txs}
          allTransactions={allTransactions}
          userNames={userNames}
          personInvolvementFilter={filter}
        />
      );
      // Get actual rendered values
      const getValue = (label: string) => {
        const labelEl = screen.getByText(new RegExp(label, "i"));
        // The value is in the next sibling span
        return labelEl.nextSibling?.textContent || "";
      };
      const actual = {
        expenses: getValue("Total Expenses"),
        income: getValue("Total Income"),
        netSaved: getValue("Net Saved"),
      };
      console.log("Actual output:", actual);
      // Check rendered values
      expect(actual.expenses).toContain(
        expected.expenses.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        })
      );
      expect(actual.income).toContain(
        expected.income.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        })
      );
      expect(actual.netSaved).toContain(
        expected.netSaved.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        })
      );
    });
  });
});
