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

// Helper to log scenario, expected, and actual output
function logScenario({
  scenario,
  transactions,
  expected,
  actual,
}: {
  scenario: string;
  transactions: Transaction[];
  expected: any;
  actual: any;
}) {
  console.group(`\nScenario: ${scenario}`);
  console.log("Input transactions:", transactions);
  console.log("Expected output:", expected);
  console.log("Actual output:", actual);
  console.groupEnd();
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
    const expected = { summary: "All square!", calculationSteps: [] };
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
    const summary = screen.getByText(/all square/i)?.textContent;
    const actual = { summary, calculationSteps: [] };
    logScenario({
      scenario:
        "Income transactions have no impact on balance and do not show in calculation steps",
      transactions,
      expected,
      actual,
    });
    expect(screen.getByText(/all square/i)).toBeInTheDocument();
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
    const expected = { owes: "Alice", owed: "Bob", amount: 50 };
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
    const summary = screen
      .getByText(/balance summary/i)
      .closest(".mb-4")?.textContent;
    const actual = { summary };
    logScenario({
      scenario: "Settlement paid by Alice to Bob reduces Alice's debt",
      transactions,
      expected,
      actual,
    });
    expectBalanceSummary(expected);
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
    const expected = { summary: "All square!" };
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
    const summary = screen.getByText(/all square/i)?.textContent;
    const actual = { summary };
    logScenario({
      scenario: 'Ignores expenses where "Paid by" is the same as "split type"',
      transactions,
      expected,
      actual,
    });
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
    const expected = { summary: "All square!" };
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
    const summary = screen.getByText(/all square/i)?.textContent;
    const actual = { summary };
    logScenario({
      scenario:
        'Ignores expenses where "Paid by" is "Shared" and split is equally',
      transactions,
      expected,
      actual,
    });
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
      const expected = { owes: "Alice", owed: "Bob", amount: 50 };
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
      await expandCalculationSteps();
      const summary = screen
        .getByText(/balance summary/i)
        .closest(".mb-4")?.textContent;
      const steps = (await getCalculationStepsContainer()).textContent;
      const actual = { summary, steps };
      logScenario({
        scenario: 'Paid by "Shared" and split for user1: user1 owes user2 half',
        transactions,
        expected,
        actual,
      });
      expectBalanceSummary(expected);
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
      const expected = { owes: "Bob", owed: "Alice", amount: 50 };
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
      await expandCalculationSteps();
      const summary = screen
        .getByText(/balance summary/i)
        .closest(".mb-4")?.textContent;
      const steps = (await getCalculationStepsContainer()).textContent;
      const actual = { summary, steps };
      logScenario({
        scenario: 'Paid by "Shared" and split for user2: user2 owes user1 half',
        transactions,
        expected,
        actual,
      });
      expectBalanceSummary(expected);
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
      const expected = { owes: "Bob", owed: "Alice", amount: 50 };
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
      await expandCalculationSteps();
      const summary = screen
        .getByText(/balance summary/i)
        .closest(".mb-4")?.textContent;
      const steps = (await getCalculationStepsContainer()).textContent;
      const actual = { summary, steps };
      logScenario({
        scenario: "Paid by Alice and split equally: Alice is owed half by Bob",
        transactions,
        expected,
        actual,
      });
      expectBalanceSummary(expected);
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
      const expected = { owes: "Bob", owed: "Alice", amount: 100 };
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
      await expandCalculationSteps();
      const summary = screen
        .getByText(/balance summary/i)
        .closest(".mb-4")?.textContent;
      const steps = (await getCalculationStepsContainer()).textContent;
      const actual = { summary, steps };
      logScenario({
        scenario:
          "Paid by Alice and split for Bob: Bob owes Alice the full amount",
        transactions,
        expected,
        actual,
      });
      expectBalanceSummary(expected);
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
      const expected = { owes: "Bob", owed: "Alice", amount: 35 };
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
      await expandCalculationSteps();
      const summary = screen
        .getByText(/balance summary/i)
        .closest(".mb-4")?.textContent;
      const steps = (await getCalculationStepsContainer()).textContent;
      const actual = { summary, steps };
      logScenario({
        scenario:
          "Reimbursement of an expense creates a virtual expense with correct properties",
        transactions,
        expected,
        actual,
      });
      expectBalanceSummary(expected);
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
    const expected = { summary: "All square!" };
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
    const summary = screen.getByText(/all square/i)?.textContent;
    const actual = { summary };
    logScenario({
      scenario:
        "Ignores reimbursement transactions that do not reimburse another transaction",
      transactions,
      expected,
      actual,
    });
    expect(screen.getByText(/all square/i)).toBeInTheDocument();
  });
});
