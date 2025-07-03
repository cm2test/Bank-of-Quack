import React from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import userEvent from "@testing-library/user-event";
import BalanceSummary from "../BalanceSummary";
import type { Transaction } from "@/types";

const userNames = ["Alice", "Bob"];
const user1AvatarUrl = null;
const user2AvatarUrl = null;

async function expandCalculationSteps() {
  const helpButton = screen.getByLabelText("calculation steps");
  await userEvent.click(helpButton);
}

async function getCalculationStepsContainer() {
  // Use the test id for robust selection, and wait for it to appear
  return await screen.findByTestId("calculation-steps");
}

function expectBalanceSummary({
  owes,
  owed,
  amount,
}: {
  owes: string;
  owed: string;
  amount: number;
}) {
  expect(screen.getAllByText(owes, { exact: false }).length).toBeGreaterThan(0);
  expect(screen.getAllByText(owed, { exact: false }).length).toBeGreaterThan(0);
  const summary = screen.getByText(/balance summary/i).closest(".mb-4");
  expect(summary?.textContent).toContain(`$${amount.toFixed(2)}`);
  expect(summary?.textContent?.toLowerCase()).toContain("owes");
}

async function expectDescriptionInSteps(desc: string) {
  const steps = await getCalculationStepsContainer();
  expect(steps).toBeTruthy();
  expect(steps.textContent?.toLowerCase()).toContain(desc.toLowerCase());
}

describe("BalanceSummary - business rules", () => {
  it("Income transactions have no impact on balance and do not show in calculation steps", () => {
    const transactions: Transaction[] = [
      {
        id: "1",
        amount: 100,
        transaction_type: "income",
        paid_by_user_name: null,
        paid_to_user_name: "Alice",
        split_type: null,
        category_id: null,
        category_name: null,
        date: "2024-01-01",
        description: "Salary",
      },
    ];
    render(
      <BalanceSummary
        transactions={transactions}
        allTransactions={transactions}
        userNames={userNames}
        user1AvatarUrl={user1AvatarUrl}
        user2AvatarUrl={user2AvatarUrl}
        showValues={true}
      />
    );
    expect(screen.getByText(/all square/i)).toBeInTheDocument();
    // No need to expand calculation steps for this test
    expect(screen.queryByText(/Salary/)).not.toBeInTheDocument();
  });

  it("Settlement paid by Alice to Bob reduces Alice's debt", () => {
    const transactions: Transaction[] = [
      {
        id: "1",
        amount: 50,
        transaction_type: "settlement",
        paid_by_user_name: "Alice",
        paid_to_user_name: "Bob",
        split_type: null,
        category_id: null,
        category_name: null,
        date: "2024-01-01",
        description: "Settle up",
      },
    ];
    render(
      <BalanceSummary
        transactions={transactions}
        allTransactions={transactions}
        userNames={userNames}
        user1AvatarUrl={user1AvatarUrl}
        user2AvatarUrl={user2AvatarUrl}
        showValues={true}
      />
    );
    expectBalanceSummary({ owes: "Alice", owed: "Bob", amount: 50 });
  });

  it('Ignores expenses where "Paid by" is the same as "split type"', () => {
    const transactions: Transaction[] = [
      {
        id: "1",
        amount: 100,
        transaction_type: "expense",
        paid_by_user_name: "Alice",
        paid_to_user_name: null,
        split_type: "user1_only",
        category_id: "cat1",
        category_name: "Food",
        date: "2024-01-01",
        description: "Alice's own expense",
      },
    ];
    render(
      <BalanceSummary
        transactions={transactions}
        allTransactions={transactions}
        userNames={userNames}
        user1AvatarUrl={user1AvatarUrl}
        user2AvatarUrl={user2AvatarUrl}
        showValues={true}
      />
    );
    expect(screen.getByText(/all square/i)).toBeInTheDocument();
  });

  it('Ignores expenses where "Paid by" is "Shared" and split is equally', () => {
    const transactions: Transaction[] = [
      {
        id: "1",
        amount: 100,
        transaction_type: "expense",
        paid_by_user_name: "Shared",
        paid_to_user_name: null,
        split_type: "splitEqually",
        category_id: "cat1",
        category_name: "Food",
        date: "2024-01-01",
        description: "Shared equally",
      },
    ];
    render(
      <BalanceSummary
        transactions={transactions}
        allTransactions={transactions}
        userNames={userNames}
        user1AvatarUrl={user1AvatarUrl}
        user2AvatarUrl={user2AvatarUrl}
        showValues={true}
      />
    );
    expect(screen.getByText(/all square/i)).toBeInTheDocument();
  });

  // Calculation steps expansion required for the following tests
  describe("Calculation steps expansion", () => {
    beforeAll(() => {
      // No-op: expansion will be done in each test after render
    });
    afterAll(() => {
      // No-op
    });

    it('Paid by "Shared" and split for user1: user1 owes user2 half', async () => {
      const transactions: Transaction[] = [
        {
          id: "1",
          amount: 100,
          transaction_type: "expense",
          paid_by_user_name: "Shared",
          paid_to_user_name: null,
          split_type: "user1_only",
          category_id: "cat1",
          category_name: "Food",
          date: "2024-01-01",
          description: "Shared paid for Alice",
        },
      ];
      render(
        <BalanceSummary
          transactions={transactions}
          allTransactions={transactions}
          userNames={userNames}
          user1AvatarUrl={user1AvatarUrl}
          user2AvatarUrl={user2AvatarUrl}
          showValues={true}
        />
      );
      expectBalanceSummary({ owes: "Alice", owed: "Bob", amount: 50 });
      await expandCalculationSteps();
      await expectDescriptionInSteps("Shared paid for Alice");
    });

    it('Paid by "Shared" and split for user2: user2 owes user1 half', async () => {
      const transactions: Transaction[] = [
        {
          id: "1",
          amount: 100,
          transaction_type: "expense",
          paid_by_user_name: "Shared",
          paid_to_user_name: null,
          split_type: "user2_only",
          category_id: "cat1",
          category_name: "Food",
          date: "2024-01-01",
          description: "Shared paid for Bob",
        },
      ];
      render(
        <BalanceSummary
          transactions={transactions}
          allTransactions={transactions}
          userNames={userNames}
          user1AvatarUrl={user1AvatarUrl}
          user2AvatarUrl={user2AvatarUrl}
          showValues={true}
        />
      );
      expectBalanceSummary({ owes: "Bob", owed: "Alice", amount: 50 });
      await expandCalculationSteps();
      await expectDescriptionInSteps("Shared paid for Bob");
    });

    it("Paid by Alice and split equally: Alice is owed half by Bob", async () => {
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
          description: "Alice paid for both",
        },
      ];
      render(
        <BalanceSummary
          transactions={transactions}
          allTransactions={transactions}
          userNames={userNames}
          user1AvatarUrl={user1AvatarUrl}
          user2AvatarUrl={user2AvatarUrl}
          showValues={true}
        />
      );
      expectBalanceSummary({ owes: "Bob", owed: "Alice", amount: 50 });
      await expandCalculationSteps();
      await expectDescriptionInSteps("Alice paid for both");
    });

    it("Paid by Alice and split for Bob: Bob owes Alice the full amount", async () => {
      const transactions: Transaction[] = [
        {
          id: "1",
          amount: 100,
          transaction_type: "expense",
          paid_by_user_name: "Alice",
          paid_to_user_name: null,
          split_type: "user2_only",
          category_id: "cat1",
          category_name: "Food",
          date: "2024-01-01",
          description: "Alice paid for Bob",
        },
      ];
      render(
        <BalanceSummary
          transactions={transactions}
          allTransactions={transactions}
          userNames={userNames}
          user1AvatarUrl={user1AvatarUrl}
          user2AvatarUrl={user2AvatarUrl}
          showValues={true}
        />
      );
      expectBalanceSummary({ owes: "Bob", owed: "Alice", amount: 100 });
      await expandCalculationSteps();
      await expectDescriptionInSteps("Alice paid for Bob");
    });

    it("Reimbursement of an expense creates a virtual expense with correct properties", async () => {
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
          amount: 30,
          transaction_type: "reimbursement",
          paid_by_user_name: "Bob",
          paid_to_user_name: "Alice",
          split_type: null,
          category_id: null,
          category_name: null,
          date: "2024-01-02",
          description: "Reimburse for dinner",
          reimburses_transaction_id: "1",
        },
      ];
      render(
        <BalanceSummary
          transactions={transactions}
          allTransactions={transactions}
          userNames={userNames}
          user1AvatarUrl={user1AvatarUrl}
          user2AvatarUrl={user2AvatarUrl}
          showValues={true}
        />
      );
      expectBalanceSummary({ owes: "Bob", owed: "Alice", amount: 35 });
      await expandCalculationSteps();
      await expectDescriptionInSteps("Dinner");
      await expectDescriptionInSteps("Reimbursement for: Dinner");
    });
  });

  it("Ignores reimbursement transactions that do not reimburse another transaction", () => {
    const transactions: Transaction[] = [
      {
        id: "1",
        amount: 30,
        transaction_type: "reimbursement",
        paid_by_user_name: "Bob",
        paid_to_user_name: "Alice",
        split_type: null,
        category_id: null,
        category_name: null,
        date: "2024-01-01",
        description: "Random reimbursement",
      },
    ];
    render(
      <BalanceSummary
        transactions={transactions}
        allTransactions={transactions}
        userNames={userNames}
        user1AvatarUrl={user1AvatarUrl}
        user2AvatarUrl={user2AvatarUrl}
        showValues={true}
      />
    );
    expect(screen.getByText(/all square/i)).toBeInTheDocument();
  });
});
