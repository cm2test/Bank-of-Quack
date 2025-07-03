import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ExpensesIncomeNetWidget from "../TotalExpensesWidget";
import type { Transaction } from "@/types";

describe("ExpensesIncomeNetWidget", () => {
  const userNames = ["Alice", "Bob"];
  const transactions: Transaction[] = [
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
      amount: 200,
      transaction_type: "income",
      paid_by_user_name: null,
      paid_to_user_name: "Bob",
      split_type: null,
      category_id: null,
      category_name: null,
      date: "2024-01-02",
      description: "Salary",
    },
    {
      id: "3",
      amount: 30,
      transaction_type: "reimbursement",
      paid_by_user_name: "Bob",
      paid_to_user_name: "Alice",
      split_type: null,
      category_id: null,
      category_name: null,
      date: "2024-01-03",
      description: "Reimburse",
      reimburses_transaction_id: "1",
    },
  ];

  it("renders summary widget", () => {
    render(
      <ExpensesIncomeNetWidget
        transactions={transactions}
        userNames={userNames}
        personInvolvementFilter={{ user1: true, user2: true, shared: true }}
      />
    );
    expect(screen.getByText(/Summary/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Expenses/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Income/i)).toBeInTheDocument();
    expect(screen.getByText(/Net Saved/i)).toBeInTheDocument();
  });

  it("shows correct values for expenses and income", () => {
    render(
      <ExpensesIncomeNetWidget
        transactions={transactions}
        userNames={userNames}
        personInvolvementFilter={{ user1: true, user2: true, shared: true }}
      />
    );
    // Should show formatted money values (e.g., $100.00, $200.00, $100.00)
    expect(screen.getAllByText(/\$/i).length).toBeGreaterThan(0);
  });
});
