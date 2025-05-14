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
  const { transactions, userNames } = useOutletContext();

  // State for date filters
  const [startDate, setStartDate] = useState(
    formatDateForInput(getFirstDayOfMonth(new Date()))
  );
  const [endDate, setEndDate] = useState(
    formatDateForInput(getLastDayOfMonth(new Date()))
  );

  // State for person involvement filter. Keys 'user1' and 'user2' correspond to userNames[0] and userNames[1]
  const [personInvolvementFilter, setPersonInvolvementFilter] = useState({
    user1: true, // Show expenses involving userNames[0]
    user2: true, // Show expenses involving userNames[1]
  });

  // Effect to ensure filter state keys are present if userNames load after initial render (though unlikely with current setup)
  // And to handle if userNames array is not yet populated (e.g. on first load before context is fully ready)
  useEffect(() => {
    if (userNames && userNames.length === 2) {
      // This effect primarily ensures that if we had a more complex scenario
      // where userNames could change structure, the filter keys are robust.
      // For the current 2-user fixed setup, direct initialization is usually fine.
    }
  }, [userNames]);

  const handlePersonFilterChange = (event) => {
    const { name, checked } = event.target; // name will be 'user1' or 'user2'
    setPersonInvolvementFilter((prevFilter) => ({
      ...prevFilter,
      [name]: checked,
    }));
  };

  // Memoized calculation for transactions within the selected date range
  const transactionsInDateRange = useMemo(() => {
    if (!transactions) return [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include the entire end day

    return transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return transactionDate >= start && transactionDate <= end;
    });
  }, [transactions, startDate, endDate]);

  // Filter transactions by person involvement
  const transactionsForSelectedInvolvement = useMemo(() => {
    // Check if userNames are available; if not, return all transactions in date range or empty array
    if (!userNames || userNames.length < 2) {
      // If no specific person filter can be applied due to missing userNames,
      // decide whether to show all (transactionsInDateRange) or none ([])
      // Showing all might be less confusing than showing none if userNames are temporarily unavailable.
      // However, if the intent is to strictly filter by person and users aren't set, an empty array is also logical.
      // For now, let's return transactionsInDateRange to avoid an empty display if userNames are just loading.
      return transactionsInDateRange;
    }

    // const [user1Name, user2Name] = userNames; // This line was causing the ESLint error and is not used.

    return transactionsInDateRange.filter((t) => {
      let includeTransaction = false;

      // Check if transaction is for User 1 (userNames[0])
      if (personInvolvementFilter.user1) {
        if (t.splitType === "user1_only" || t.splitType === "splitEqually") {
          includeTransaction = true;
        }
      }

      // Check if transaction is for User 2 (userNames[1])
      // If already included for user1, no need to check again if OR logic is desired
      if (!includeTransaction && personInvolvementFilter.user2) {
        if (t.splitType === "user2_only" || t.splitType === "splitEqually") {
          includeTransaction = true;
        }
      }

      // If both filters are off, no transactions will be included by this logic.
      if (!personInvolvementFilter.user1 && !personInvolvementFilter.user2) {
        return false;
      }

      return includeTransaction;
    });
  }, [transactionsInDateRange, personInvolvementFilter, userNames]);

  // Calculate total expenses based on the new involvement filter
  const totalExpensesForSelectedInvolvement = useMemo(() => {
    return transactionsForSelectedInvolvement.reduce(
      (sum, t) => sum + t.amount,
      0
    );
  }, [transactionsForSelectedInvolvement]);

  const getSelectedInvolvementText = () => {
    if (!userNames || userNames.length < 2) return "All Users"; // Fallback if userNames not ready
    const selected = [];
    if (personInvolvementFilter.user1) selected.push(userNames[0]);
    if (personInvolvementFilter.user2) selected.push(userNames[1]);

    if (selected.length === 2) return "All Relevant"; // Both selected
    if (selected.length === 0) return "None Selected"; // Neither selected
    return selected.join(", "); // Only one selected
  };

  return (
    <div>
      <h2>Dashboard</h2>

      {/* Filter Controls */}
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
                name="user1" // Corresponds to key in personInvolvementFilter
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
                name="user2" // Corresponds to key in personInvolvementFilter
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
              Configure user names in Settings to enable person filter.
            </span>
          )}
        </div>
      </div>

      {/* Dashboard Widgets */}
      <BalanceSummary transactionsInDateRange={transactionsInDateRange} />

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
