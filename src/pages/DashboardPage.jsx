// src/pages/DashboardPage.jsx
import React, { useState, useMemo, useEffect } from "react";
import { useOutletContext } from "react-router-dom";

// Import utility functions
import {
  getFirstDayOfMonth,
  getLastDayOfMonth,
  formatDateForInput,
} from "../utils/dateUtils";

// Import dashboard widget components
import BalanceSummary from "../components/dashboard/BalanceSummary";
import TotalExpensesWidget from "../components/dashboard/TotalExpensesWidget";
import CategoryBreakdownWidget from "../components/dashboard/CategoryBreakdownWidget";

// TransactionList is still used for recent transactions
import TransactionList from "../components/TransactionList";

function DashboardPage() {
  const { transactions, userNames } = useOutletContext(); // userNames is now explicitly used here for filter UI
  console.log(
    "[DashboardPage] Received transactions from context:",
    transactions
  );
  console.log("[DashboardPage] Received userNames from context:", userNames);

  // State for date filters
  const [startDate, setStartDate] = useState(
    formatDateForInput(getFirstDayOfMonth(new Date()))
  );
  const [endDate, setEndDate] = useState(
    formatDateForInput(getLastDayOfMonth(new Date()))
  );

  // State for person involvement filter
  const [personInvolvementFilter, setPersonInvolvementFilter] = useState({
    user1: true,
    user2: true,
  });

  useEffect(() => {
    // This effect can be used to reset filter if userNames change structure,
    // but for now, it's mainly for logging or future enhancements.
    console.log("[DashboardPage] userNames context updated:", userNames);
  }, [userNames]);

  const handlePersonFilterChange = (event) => {
    const { name, checked } = event.target;
    setPersonInvolvementFilter((prevFilter) => ({
      ...prevFilter,
      [name]: checked,
    }));
  };

  const transactionsInDateRange = useMemo(() => {
    console.log(
      "[DashboardPage] Calculating transactionsInDateRange. Input transactions:",
      transactions
    );
    if (!transactions || transactions.length === 0) return [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const filtered = transactions.filter((t) => {
      if (!t.date) return false;
      const transactionDate = new Date(t.date);
      return (
        !isNaN(transactionDate.getTime()) &&
        transactionDate >= start &&
        transactionDate <= end
      );
    });
    console.log("[DashboardPage] transactionsInDateRange result:", filtered);
    return filtered;
  }, [transactions, startDate, endDate]);

  const transactionsForSelectedInvolvement = useMemo(() => {
    console.log(
      "[DashboardPage] Calculating transactionsForSelectedInvolvement. Input:",
      transactionsInDateRange,
      "Filter:",
      personInvolvementFilter,
      "UserNames:",
      userNames
    );
    if (!userNames || userNames.length < 2) {
      // If userNames aren't fully available, return all transactions in date range
      // as person-specific filtering isn't possible.
      return transactionsInDateRange;
    }

    // If both filters are true, or both are false, effectively no person filter is applied (show all relevant to the split)
    // This logic might need refinement based on desired behavior when both are false.
    // Current: if both false, shows nothing. If both true, shows transactions involving either.
    if (personInvolvementFilter.user1 && personInvolvementFilter.user2) {
      return transactionsInDateRange; // Show all transactions if both are checked (or refine to show only those involving either)
    }
    if (!personInvolvementFilter.user1 && !personInvolvementFilter.user2) {
      return []; // Show no transactions if neither person is selected
    }

    return transactionsInDateRange.filter((t) => {
      if (
        personInvolvementFilter.user1 &&
        (t.split_type === "user1_only" || t.split_type === "splitEqually")
      ) {
        return true;
      }
      if (
        personInvolvementFilter.user2 &&
        (t.split_type === "user2_only" || t.split_type === "splitEqually")
      ) {
        return true;
      }
      return false;
    });
  }, [transactionsInDateRange, personInvolvementFilter, userNames]);

  const totalExpensesForSelectedInvolvement = useMemo(() => {
    return transactionsForSelectedInvolvement.reduce(
      (sum, t) => sum + t.amount,
      0
    );
  }, [transactionsForSelectedInvolvement]);

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
          <label htmlFor="startDate">From: </label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ marginRight: "20px" }}
          />
          <label htmlFor="endDate">To: </label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div>
          <label>Show expenses for: </label>
          {userNames && userNames.length > 0 && (
            <span style={{ marginRight: "15px" }}>
              <input
                type="checkbox"
                id="filterUser1"
                name="user1"
                checked={personInvolvementFilter.user1}
                onChange={handlePersonFilterChange}
              />
              <label htmlFor="filterUser1" style={{ marginLeft: "5px" }}>
                {userNames[0]}
              </label>
            </span>
          )}
          {userNames && userNames.length > 1 && (
            <span>
              <input
                type="checkbox"
                id="filterUser2"
                name="user2"
                checked={personInvolvementFilter.user2}
                onChange={handlePersonFilterChange}
              />
              <label htmlFor="filterUser2" style={{ marginLeft: "5px" }}>
                {userNames[1]}
              </label>
            </span>
          )}
          {(!userNames || userNames.length < 2) && (
            <span style={{ fontStyle: "italic" }}>
              Configure user names in Settings.
            </span>
          )}
        </div>
      </div>

      {/* BalanceSummary should use transactionsInDateRange as it's about the overall balance */}
      <BalanceSummary transactionsInDateRange={transactionsInDateRange} />

      {/* Other widgets use the person-filtered transactions */}
      <TotalExpensesWidget
        transactionsInDateRange={transactionsForSelectedInvolvement}
      />
      <CategoryBreakdownWidget
        transactionsInDateRange={transactionsForSelectedInvolvement}
        totalExpenses={totalExpensesForSelectedInvolvement}
      />

      <div id="recentTransactionsSection" style={{ marginTop: "20px" }}>
        <h3>Recent Transactions (For: {getSelectedInvolvementText()})</h3>
        <TransactionList transactions={transactionsForSelectedInvolvement} />
      </div>
    </div>
  );
}

export default DashboardPage;
