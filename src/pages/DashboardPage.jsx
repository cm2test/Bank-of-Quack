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
import TransactionList from "../components/TransactionList";

function DashboardPage() {
  const { transactions, userNames, categories, sectors } = useOutletContext();
  console.log("[DashboardPage] Context:", {
    transactions,
    userNames,
    categories,
    sectors,
  });

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

  // State for category/sector filter. Value can be 'all', 'cat_CATEGORY_ID', or 'sec_SECTOR_ID'
  const [categorySectorFilter, setCategorySectorFilter] = useState("all");

  useEffect(() => {
    console.log("[DashboardPage] userNames context updated:", userNames);
  }, [userNames]);

  const handlePersonFilterChange = (event) => {
    const { name, checked } = event.target;
    setPersonInvolvementFilter((prevFilter) => ({
      ...prevFilter,
      [name]: checked,
    }));
  };

  const handleCategorySectorFilterChange = (event) => {
    setCategorySectorFilter(event.target.value);
  };

  const transactionsInDateRange = useMemo(() => {
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
    });
  }, [transactions, startDate, endDate]);

  const transactionsByPerson = useMemo(() => {
    if (!userNames || userNames.length < 2) return transactionsInDateRange;
    if (personInvolvementFilter.user1 && personInvolvementFilter.user2)
      return transactionsInDateRange;
    if (!personInvolvementFilter.user1 && !personInvolvementFilter.user2)
      return [];

    return transactionsInDateRange.filter((t) => {
      if (
        personInvolvementFilter.user1 &&
        (t.split_type === "user1_only" || t.split_type === "splitEqually")
      )
        return true;
      if (
        personInvolvementFilter.user2 &&
        (t.split_type === "user2_only" || t.split_type === "splitEqually")
      )
        return true;
      return false;
    });
  }, [transactionsInDateRange, personInvolvementFilter, userNames]);

  const finalFilteredTransactions = useMemo(() => {
    console.log(
      "[DashboardPage] Applying Category/Sector Filter. Current selection:",
      categorySectorFilter
    );
    console.log("[DashboardPage] Categories available for filter:", categories);
    console.log("[DashboardPage] Sectors available for filter:", sectors);

    if (categorySectorFilter === "all") {
      return transactionsByPerson;
    }

    const [type, id] = categorySectorFilter.split("_");

    if (type === "cat") {
      const selectedCategory = categories.find((c) => c.id === id);
      if (!selectedCategory) return transactionsByPerson; // Should not happen if UI is correct
      console.log(
        "[DashboardPage] Filtering by Category Name:",
        selectedCategory.name
      );
      return transactionsByPerson.filter(
        (t) => t.category_name === selectedCategory.name
      );
    }

    if (type === "sec") {
      const selectedSector = sectors.find((s) => s.id === id);
      if (!selectedSector || !selectedSector.category_ids)
        return transactionsByPerson;

      // Get names of categories within the selected sector
      const categoryNamesInSector = selectedSector.category_ids
        .map((catId) => {
          const category = categories.find((c) => c.id === catId);
          return category ? category.name : null;
        })
        .filter((name) => name !== null); // Filter out nulls if a category ID in sector is somehow invalid

      console.log(
        "[DashboardPage] Filtering by Sector. Categories in sector:",
        categoryNamesInSector
      );
      if (categoryNamesInSector.length === 0) return []; // No categories in sector, so no transactions match

      return transactionsByPerson.filter((t) =>
        categoryNamesInSector.includes(t.category_name)
      );
    }
    return transactionsByPerson; // Fallback
  }, [transactionsByPerson, categorySectorFilter, categories, sectors]);

  const totalExpensesForFinalFilter = useMemo(() => {
    return finalFilteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [finalFilteredTransactions]);

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
        {/* Date Filters */}
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
        {/* Person Filters */}
        <div style={{ marginBottom: "10px" }}>
          <label style={{ marginRight: "10px" }}>Show expenses for:</label>
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
        </div>
        {/* Category/Sector Filter */}
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
              {categories.map((cat) => (
                <option key={`cat_${cat.id}`} value={`cat_${cat.id}`}>
                  {cat.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Sectors">
              {sectors.map((sec) => (
                <option key={`sec_${sec.id}`} value={`sec_${sec.id}`}>
                  {sec.name}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      <BalanceSummary transactionsInDateRange={transactionsInDateRange} />
      <TotalExpensesWidget
        transactionsInDateRange={finalFilteredTransactions}
      />
      <CategoryBreakdownWidget
        transactionsInDateRange={finalFilteredTransactions}
        totalExpenses={totalExpensesForFinalFilter}
      />

      <div id="recentTransactionsSection" style={{ marginTop: "20px" }}>
        <h3>Recent Transactions (For: {getSelectedInvolvementText()})</h3>
        <TransactionList transactions={finalFilteredTransactions} />
      </div>
    </div>
  );
}

export default DashboardPage;
