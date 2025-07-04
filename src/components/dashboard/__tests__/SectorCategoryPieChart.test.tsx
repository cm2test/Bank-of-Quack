import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import SectorCategoryPieChart from "../SectorCategoryPieChart";
import type { Transaction, Category, Sector } from "@/types";

describe("SectorCategoryPieChart", () => {
  const userNames = ["Alice", "Bob"];
  const categories: Category[] = [
    { id: "cat1", name: "Food", image_url: "" },
    { id: "cat2", name: "Travel", image_url: "" },
  ];
  const sectors: Sector[] = [
    { id: "sec1", name: "Essentials", category_ids: ["cat1"] },
    { id: "sec2", name: "Leisure", category_ids: ["cat2"] },
  ];
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
      amount: 50,
      transaction_type: "expense",
      paid_by_user_name: "Bob",
      paid_to_user_name: null,
      split_type: "user2_only",
      category_id: "cat2",
      category_name: "Travel",
      date: "2024-01-02",
      description: "Taxi",
    },
    {
      id: "3",
      amount: 30,
      transaction_type: "reimbursement",
      paid_by_user_name: "Bob",
      paid_to_user_name: "Alice",
      split_type: "splitEqually",
      category_id: "cat1",
      category_name: "Food",
      date: "2024-01-03",
      description: "Reimbursement for Dinner",
      reimburses_transaction_id: "1",
    } as Transaction,
  ];

  it("renders pie chart and sector breakdown", async () => {
    render(
      <SectorCategoryPieChart
        transactions={transactions}
        allTransactions={transactions}
        categories={categories}
        sectors={sectors}
        userNames={userNames}
        deleteTransaction={async () => {}}
        handleSetEditingTransaction={() => {}}
        personInvolvementFilter={{ user1: true, user2: true, shared: true }}
      />
    );
    expect(
      screen.getByText(/Sector & Category Breakdown/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Essentials/i)).toBeInTheDocument();
    expect(screen.getByText(/Leisure/i)).toBeInTheDocument();

    // Expand both accordions
    const essentialsButton = screen.getByRole("button", {
      name: /Essentials/i,
    });
    const leisureButton = screen.getByRole("button", { name: /Leisure/i });
    await userEvent.click(essentialsButton);
    await userEvent.click(leisureButton);

    expect(screen.getByText(/Food/i)).toBeInTheDocument();
    expect(screen.getByText(/Travel/i)).toBeInTheDocument();
  });

  // Helper to log scenario, expected, and actual output
  function logScenario({
    scenario,
    transactions,
    expected,
    actual,
    sectors,
    categories,
  }: {
    scenario: string;
    transactions: Transaction[];
    expected: any;
    actual: any;
    sectors: Sector[];
    categories: Category[];
  }) {
    console.group(`\nScenario: ${scenario}`);
    console.log("Input transactions:", transactions);
    console.log("Sectors:", sectors);
    console.log("Categories:", categories);
    console.log("Expected output:", expected);
    console.log("Actual output:", actual);
    console.groupEnd();
  }

  it("renders sector headings with correct sums (expenses minus reimbursements)", async () => {
    const scenario =
      "Sector headings show correct sums (expenses minus reimbursements)";
    const expected = {
      Essentials: "$70.00",
      Leisure: "$50.00",
    };
    render(
      <SectorCategoryPieChart
        transactions={transactions}
        allTransactions={transactions}
        categories={categories}
        sectors={sectors}
        userNames={userNames}
        deleteTransaction={async () => {}}
        handleSetEditingTransaction={() => {}}
        personInvolvementFilter={{ user1: true, user2: true, shared: true }}
      />
    );
    expect(
      screen.getByText(/Sector & Category Breakdown/i)
    ).toBeInTheDocument();
    // Expand both accordions
    const essentialsButton = screen.getByRole("button", {
      name: /Essentials/i,
    });
    const leisureButton = screen.getByRole("button", { name: /Leisure/i });
    await userEvent.click(essentialsButton);
    await userEvent.click(leisureButton);

    // Use more targeted queries for sector headings
    const essentialsHeader = screen.getByRole("button", {
      name: /Essentials/i,
    });
    const essentialsSum = within(essentialsHeader).getByText("$70.00");
    const leisureHeader = screen.getByRole("button", { name: /Leisure/i });
    const leisureSum = within(leisureHeader).getByText("$50.00");

    const actual = {
      Essentials: essentialsSum.textContent,
      Leisure: leisureSum.textContent,
    };
    logScenario({
      scenario,
      transactions,
      expected,
      actual,
      sectors,
      categories,
    });

    expect(essentialsSum).toBeInTheDocument();
    expect(leisureSum).toBeInTheDocument();

    // Check that category names are still rendered
    expect(screen.getByText(/Food/i)).toBeInTheDocument();
    expect(screen.getByText(/Travel/i)).toBeInTheDocument();
  });
});
