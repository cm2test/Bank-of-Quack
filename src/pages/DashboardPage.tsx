// src/pages/DashboardPage.jsx
import React, { useState, useMemo, useEffect, ChangeEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { Transaction, Category, Sector } from "../App";

import {
  getFirstDayOfMonth,
  getLastDayOfMonth,
  formatDateForInput,
} from "../utils/dateUtils";
import BalanceSummary from "../components/dashboard/BalanceSummary";
import TotalExpensesWidget from "../components/dashboard/TotalExpensesWidget";
import CategoryBreakdownWidget from "../components/dashboard/CategoryBreakdownWidget";
import TransactionList from "../components/TransactionList";

interface DashboardPageContext {
  transactions: Transaction[];
  userNames: string[];
  categories: Category[];
  sectors: Sector[];
}

type TransactionWithExtras = Transaction & {
  category_name_for_reimbursement_logic?: string;
  effectiveAmount?: number;
};

const DashboardPage: React.FC = () => {
  const { transactions, userNames, categories, sectors } =
    useOutletContext<DashboardPageContext>();

  const [startDate, setStartDate] = useState<string>(
    formatDateForInput(getFirstDayOfMonth(new Date()))
  );
  const [endDate, setEndDate] = useState<string>(
    formatDateForInput(getLastDayOfMonth(new Date()))
  );
  const [personInvolvementFilter, setPersonInvolvementFilter] = useState<{
    user1: boolean;
    user2: boolean;
  }>({
    user1: true,
    user2: true,
  });
  const [categorySectorFilter, setCategorySectorFilter] =
    useState<string>("all");

  useEffect(() => {}, [userNames]);

  const handlePersonFilterChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    setPersonInvolvementFilter((prevFilter) => ({
      ...prevFilter,
      [name]: checked,
    }));
  };

  const handleCategorySectorFilterChange = (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    setCategorySectorFilter(event.target.value);
  };

  // 1. Filter by Date (Base for all other filters)
  const transactionsInDateRange = useMemo<TransactionWithExtras[]>(() => {
    if (!transactions || transactions.length === 0) return [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return transactions.filter((t) => {
      if (!t.date) return false;
      const transactionDate = new Date(t.date);
      return (
        !isNaN(transactionDate.getTime()) &&
        transactionDate >= start &&
        transactionDate <= end
      );
    }) as TransactionWithExtras[];
  }, [transactions, startDate, endDate]);

  // 2. Pre-process transactions to apply linked reimbursements to expenses
  const effectiveTransactions = useMemo<TransactionWithExtras[]>(() => {
    if (!transactionsInDateRange) return [];
    const expensesToAdjust = transactionsInDateRange
      .filter((t) => t.transaction_type === "expense")
      .map((expense) => ({
        ...expense,
        effectiveAmount: expense.amount,
        category_name_for_reimbursement_logic: expense.category_name,
      }));
    const reimbursements = transactionsInDateRange.filter(
      (t) => t.transaction_type === "reimbursement"
    );
    reimbursements.forEach((r) => {
      if (r.reimburses_transaction_id) {
        const originalExpense = expensesToAdjust.find(
          (exp) => exp.id === r.reimburses_transaction_id
        );
        if (originalExpense) {
          originalExpense.effectiveAmount -= r.amount;
        }
      }
    });
    return transactionsInDateRange.map((t) => {
      if (t.transaction_type === "expense") {
        const adjustedExpense = expensesToAdjust.find((exp) => exp.id === t.id);
        return adjustedExpense
          ? { ...adjustedExpense, amount: adjustedExpense.effectiveAmount }
          : t;
      }
      return t;
    }) as TransactionWithExtras[];
  }, [transactionsInDateRange]);

  // 3. Prepare transactions specifically for Expense Widgets (TotalExpenses, CategoryBreakdown)
  // This list will contain only 'expense' type transactions with amounts adjusted based on person filter.
  const expensesForWidgets = useMemo(() => {
    if (!effectiveTransactions || !userNames || userNames.length < 2) return [];

    // const [user1Name, user2Name] = userNames; // These were unused here, causing ESLint error. userNames[0] and userNames[1] are used directly.
    const onlyUser1Selected =
      personInvolvementFilter.user1 && !personInvolvementFilter.user2;
    const onlyUser2Selected =
      personInvolvementFilter.user2 && !personInvolvementFilter.user1;
    const combinedView =
      (personInvolvementFilter.user1 && personInvolvementFilter.user2) ||
      (!personInvolvementFilter.user1 && !personInvolvementFilter.user2);

    return effectiveTransactions
      .filter((t) => t.transaction_type === "expense")
      .map((expense) => {
        let individualAmount = expense.amount;

        if (onlyUser1Selected) {
          if (expense.split_type === "user1_only") {
            // Full amount for User1
          } else if (expense.split_type === "splitEqually") {
            individualAmount /= 2;
          } else if (expense.split_type === "user2_only") {
            return null;
          }
        } else if (onlyUser2Selected) {
          if (expense.split_type === "user2_only") {
            // Full amount for User2
          } else if (expense.split_type === "splitEqually") {
            individualAmount /= 2;
          } else if (expense.split_type === "user1_only") {
            return null;
          }
        } else if (combinedView) {
          // Keep full amount for combined view
        } else {
          return null;
        }
        return { ...expense, amount: individualAmount };
      })
      .filter(
        (expense): expense is TransactionWithExtras =>
          expense !== null && expense.amount !== undefined
      );
  }, [effectiveTransactions, personInvolvementFilter, userNames]);

  // 4. Filter by Person Involvement for the general TransactionList display
  const transactionsByPersonForDisplay = useMemo(() => {
    if (!userNames || userNames.length < 2) return effectiveTransactions;
    if (
      (personInvolvementFilter.user1 && personInvolvementFilter.user2) ||
      (!personInvolvementFilter.user1 && !personInvolvementFilter.user2)
    ) {
      return effectiveTransactions;
    }
    return effectiveTransactions.filter((t) => {
      const type = t.transaction_type || "expense";
      if (personInvolvementFilter.user1) {
        if (t.paid_by_user_name === userNames[0]) return true;
        if (
          type === "expense" &&
          (t.split_type === "user1_only" || t.split_type === "splitEqually")
        )
          return true;
        if (type === "settlement" && t.paid_to_user_name === userNames[0])
          return true;
      }
      if (personInvolvementFilter.user2) {
        if (t.paid_by_user_name === userNames[1]) return true;
        if (
          type === "expense" &&
          (t.split_type === "user2_only" || t.split_type === "splitEqually")
        )
          return true;
        if (type === "settlement" && t.paid_to_user_name === userNames[1])
          return true;
      }
      return false;
    });
  }, [effectiveTransactions, personInvolvementFilter, userNames]);

  // 5. Filter by Category/Sector (applied to transactionsByPersonForDisplay)
  const finalFilteredTransactionsForDisplay = useMemo(() => {
    if (categorySectorFilter === "all") return transactionsByPersonForDisplay;
    const [filterType, filterId] = categorySectorFilter.split("_");

    return transactionsByPersonForDisplay.filter((t) => {
      const type = t.transaction_type || "expense";
      if (type !== "expense") return true;

      const categoryToMatch =
        t.category_name_for_reimbursement_logic || t.category_name;

      if (filterType === "cat") {
        const selectedCategory = categories.find(
          (c) => c.id === (filterId as string)
        );
        return selectedCategory && categoryToMatch === selectedCategory.name;
      }
      if (filterType === "sec") {
        const selectedSector = sectors.find(
          (s) => s.id === (filterId as string)
        );
        if (!selectedSector || !selectedSector.category_ids) return false;
        const categoryNamesInSector = selectedSector.category_ids
          .map((catId: string) => categories.find((c) => c.id === catId)?.name)
          .filter((name: string | undefined): name is string => !!name);
        return (
          categoryToMatch && categoryNamesInSector.includes(categoryToMatch)
        );
      }
      return true;
    });
  }, [
    transactionsByPersonForDisplay,
    categorySectorFilter,
    categories,
    sectors,
  ]);

  const getSelectedInvolvementText = () => {
    if (!userNames || userNames.length < 2) return "All Users";
    const selected = [];
    if (personInvolvementFilter.user1) selected.push(userNames[0]);
    if (personInvolvementFilter.user2) selected.push(userNames[1]);
    if (selected.length === 2) return "All Relevant";
    if (selected.length === 0) return "None Selected";
    return selected.join(" & ");
  };

  return (
    <div>
      <h2>Dashboard</h2>
      <div
        style={{
          marginBottom: "20px",
          padding: "10px",
          border: "1px solid #eee",
        }}
      >
        <h3>Filters</h3>
        <div style={{ marginBottom: "10px" }}>
          <label htmlFor="startDate" style={{ marginRight: "5px" }}>
            From:
          </label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ marginRight: "20px" }}
          />
          <label htmlFor="endDate" style={{ marginRight: "5px" }}>
            To:
          </label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label style={{ marginRight: "10px" }}>Show expenses for:</label>
          {userNames && userNames.length > 0 && (
            <span style={{ marginRight: "15px" }}>
              {" "}
              <input
                type="checkbox"
                id="filterUser1"
                name="user1"
                checked={personInvolvementFilter.user1}
                onChange={handlePersonFilterChange}
              />{" "}
              <label htmlFor="filterUser1" style={{ marginLeft: "5px" }}>
                {userNames[0]}
              </label>{" "}
            </span>
          )}
          {userNames && userNames.length > 1 && (
            <span>
              {" "}
              <input
                type="checkbox"
                id="filterUser2"
                name="user2"
                checked={personInvolvementFilter.user2}
                onChange={handlePersonFilterChange}
              />{" "}
              <label htmlFor="filterUser2" style={{ marginLeft: "5px" }}>
                {userNames[1]}
              </label>{" "}
            </span>
          )}
        </div>
        <div>
          <label htmlFor="categorySectorFilter" style={{ marginRight: "5px" }}>
            Filter by Category/Sector:
          </label>
          <select
            id="categorySectorFilter"
            value={categorySectorFilter}
            onChange={handleCategorySectorFilterChange}
          >
            <option value="all">All Categories/Sectors</option>
            <optgroup label="Categories">
              {" "}
              {categories.map((cat) => (
                <option key={`cat_${cat.id}`} value={`cat_${cat.id}`}>
                  {cat.name}
                </option>
              ))}{" "}
            </optgroup>
            <optgroup label="Sectors">
              {" "}
              {sectors.map((sec) => (
                <option key={`sec_${sec.id}`} value={`sec_${sec.id}`}>
                  {sec.name}
                </option>
              ))}{" "}
            </optgroup>
          </select>
        </div>
      </div>

      <BalanceSummary transactionsInDateRange={transactionsInDateRange} />
      <TotalExpensesWidget transactionsInDateRange={expensesForWidgets} />
      <CategoryBreakdownWidget transactionsInDateRange={expensesForWidgets} />

      <div id="recentTransactionsSection" style={{ marginTop: "20px" }}>
        <h3>Recent Transactions (Involving: {getSelectedInvolvementText()})</h3>
        <TransactionList transactions={finalFilteredTransactionsForDisplay} />
      </div>
    </div>
  );
};

export default DashboardPage;
