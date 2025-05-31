// src/pages/DashboardPage.jsx
import React, { useState, useMemo, useEffect, ChangeEvent } from "react";
import { useOutletContext } from "react-router-dom";
// import { Transaction, Category, Sector } from "../App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  getFirstDayOfMonth,
  getLastDayOfMonth,
  formatDateForInput,
} from "../utils/dateUtils";
import BalanceSummary from "../components/dashboard/BalanceSummary";
import ExpensesIncomeNetWidget from "../components/dashboard/TotalExpensesWidget";
import CategoryBreakdownWidget from "../components/dashboard/CategoryBreakdownWidget";
import TransactionList from "../components/TransactionList";
import { supabase } from "../supabaseClient";
import SectorCategoryPieChart from "../components/dashboard/SectorCategoryPieChart";

// Use 'any' for types to resolve linter errors
// type Transaction = any;
// type Category = any;
// type Sector = any;

interface DashboardPageContext {
  transactions: any[];
  userNames: string[];
  categories: any[];
  sectors: any[];
}

type TransactionWithExtras = any;

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
    shared: boolean;
  }>({
    user1: true,
    user2: true,
    shared: true,
  });
  const [categorySectorFilter, setCategorySectorFilter] =
    useState<string>("all");
  const [allTransactionsState, setAllTransactionsState] =
    useState(transactions);
  const [descriptionFilter, setDescriptionFilter] = useState("");
  const [showValues, setShowValues] = useState(true);

  useEffect(() => {
    setAllTransactionsState(transactions);
  }, [transactions]);

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
    if (!allTransactionsState || allTransactionsState.length === 0) return [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return allTransactionsState.filter((t) => {
      if (!t.date) return false;
      const transactionDate = new Date(t.date);
      return (
        !isNaN(transactionDate.getTime()) &&
        transactionDate >= start &&
        transactionDate <= end
      );
    }) as TransactionWithExtras[];
  }, [allTransactionsState, startDate, endDate]);

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
    const onlyUser1 =
      personInvolvementFilter.user1 && !personInvolvementFilter.user2;
    const onlyUser2 =
      personInvolvementFilter.user2 && !personInvolvementFilter.user1;
    const bothUsers =
      personInvolvementFilter.user1 && personInvolvementFilter.user2;
    const shared = personInvolvementFilter.shared;
    return effectiveTransactions
      .filter((t) => t.transaction_type === "expense")
      .map((expense) => {
        if (
          expense.split_type === "user1_only" &&
          personInvolvementFilter.user1
        ) {
          return expense;
        }
        if (
          expense.split_type === "user2_only" &&
          personInvolvementFilter.user2
        ) {
          return expense;
        }
        if (expense.split_type === "splitEqually" && shared) {
          if (onlyUser1 || onlyUser2) {
            return { ...expense, amount: expense.amount / 2 };
          }
          // both users or only shared checked
          return expense;
        }
        return null;
      })
      .filter((expense): expense is TransactionWithExtras => expense !== null);
  }, [effectiveTransactions, personInvolvementFilter, userNames]);

  // 4. Filter by Person Involvement for the general TransactionList display (use raw, unadjusted transactions)
  const transactionsByPersonForDisplayRaw = useMemo(() => {
    if (!userNames || userNames.length < 2) return transactionsInDateRange;
    const onlyUser1 =
      personInvolvementFilter.user1 && !personInvolvementFilter.user2;
    const onlyUser2 =
      personInvolvementFilter.user2 && !personInvolvementFilter.user1;
    const bothUsers =
      personInvolvementFilter.user1 && personInvolvementFilter.user2;
    const shared = personInvolvementFilter.shared;
    return transactionsInDateRange.filter((t) => {
      const type = t.transaction_type || "expense";
      if (type === "expense") {
        if (t.split_type === "user1_only" && personInvolvementFilter.user1)
          return true;
        if (t.split_type === "user2_only" && personInvolvementFilter.user2)
          return true;
        if (t.split_type === "splitEqually" && shared) return true;
        return false;
      }
      if (type === "income") {
        if (t.paid_by_user_name === "Shared") {
          if (
            bothUsers ||
            (!personInvolvementFilter.user1 && !personInvolvementFilter.user2)
          )
            return true;
          if (onlyUser1 || onlyUser2) return true; // show, but will be split in summary, here just show
          return false;
        }
        if (onlyUser1) {
          return t.paid_by_user_name === userNames[0];
        } else if (onlyUser2) {
          return t.paid_by_user_name === userNames[1];
        } else if (
          bothUsers ||
          (!personInvolvementFilter.user1 && !personInvolvementFilter.user2)
        ) {
          return true;
        }
        return false;
      }
      // For other transaction types (reimbursement, settlement, etc), always include
      return true;
    });
  }, [transactionsInDateRange, personInvolvementFilter, userNames]);

  // 5. Filter by Category/Sector (applied to transactionsByPersonForDisplayRaw)
  const finalFilteredTransactionsForDisplay = useMemo(() => {
    if (categorySectorFilter === "all")
      return transactionsByPersonForDisplayRaw.filter(
        (t) =>
          !descriptionFilter ||
          (t.description &&
            t.description
              .toLowerCase()
              .includes(descriptionFilter.toLowerCase()))
      );
    const [filterType, filterId] = categorySectorFilter.split("_");

    return transactionsByPersonForDisplayRaw.filter((t) => {
      const type = t.transaction_type || "expense";
      // Only show expense and reimbursement transactions for category/sector filter
      if (type !== "expense" && type !== "reimbursement") return false;

      const categoryToMatch =
        t.category_name_for_reimbursement_logic || t.category_name;

      // If category is null/blank, do not show
      if (!categoryToMatch || categoryToMatch.trim() === "") return false;

      // Description filter
      if (
        descriptionFilter &&
        (!t.description ||
          !t.description
            .toLowerCase()
            .includes(descriptionFilter.toLowerCase()))
      ) {
        return false;
      }

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
    transactionsByPersonForDisplayRaw,
    categorySectorFilter,
    categories,
    sectors,
    descriptionFilter,
  ]);

  // 6. Apply category/sector filter to expensesForWidgets for widgets
  const expensesForWidgetsFiltered = useMemo(() => {
    if (categorySectorFilter === "all") {
      return expensesForWidgets.filter(
        (t) =>
          !descriptionFilter ||
          (t.description &&
            t.description
              .toLowerCase()
              .includes(descriptionFilter.toLowerCase()))
      );
    }
    const [filterType, filterId] = categorySectorFilter.split("_");
    return expensesForWidgets.filter((t) => {
      const type = t.transaction_type || "expense";
      // Only show expense and reimbursement transactions for category/sector filter
      if (type !== "expense" && type !== "reimbursement") return false;
      const categoryToMatch =
        t.category_name_for_reimbursement_logic || t.category_name;
      if (!categoryToMatch || categoryToMatch.trim() === "") return false;
      // Description filter
      if (
        descriptionFilter &&
        (!t.description ||
          !t.description
            .toLowerCase()
            .includes(descriptionFilter.toLowerCase()))
      ) {
        return false;
      }
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
    expensesForWidgets,
    categorySectorFilter,
    categories,
    sectors,
    descriptionFilter,
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

  const deleteTransaction = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this transaction?"))
      return;
    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setAllTransactionsState((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      alert("Error deleting transaction. Please try again.");
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-2 py-4 sm:p-4">
      <div className="flex items-center mb-4">
        <h2 className="text-2xl font-bold mr-2">Dashboard</h2>
        <button
          type="button"
          aria-label={showValues ? "Hide dollar values" : "Show dollar values"}
          onClick={() => setShowValues((v) => !v)}
          className={cn(
            "transition-colors rounded-full p-1 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary",
            showValues ? "text-primary" : "text-muted-foreground"
          )}
        >
          {showValues ? (
            <Eye className="w-5 h-5" />
          ) : (
            <EyeOff className="w-5 h-5" />
          )}
        </button>
      </div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:grid-rows-2 md:gap-6 mb-4">
            {/* Top left: From/To dates */}
            <div className="flex flex-col w-full md:flex-row md:col-start-1 md:row-start-1 md:space-x-4">
              <div className="flex flex-col w-full md:w-auto min-w-[160px]">
                <Label htmlFor="startDate" className="mb-1">
                  From
                </Label>
                <Input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 rounded-md px-3 py-2 bg-background text-sm appearance-none w-full md:w-[160px]"
                />
              </div>
              <div className="flex flex-col w-full md:w-auto min-w-[160px] md:ml-0 md:mt-0 mt-2">
                <Label htmlFor="endDate" className="mb-1">
                  To
                </Label>
                <Input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 rounded-md px-3 py-2 bg-background text-sm appearance-none w-full md:w-[160px]"
                />
              </div>
            </div>
            {/* Top right: Category/Sector select */}
            <div className="flex flex-col w-full md:col-start-2 md:row-start-1">
              <Label htmlFor="categorySectorFilter" className="mb-1">
                Filter by Category/Sector
              </Label>
              <Select
                value={categorySectorFilter}
                onValueChange={setCategorySectorFilter}
              >
                <SelectTrigger
                  id="categorySectorFilter"
                  className="w-full bg-background"
                >
                  <SelectValue placeholder="All Categories/Sectors" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-900 border border-border">
                  <SelectItem value="all">All Categories/Sectors</SelectItem>
                  <SelectItem value="label_categories" disabled>
                    Categories
                  </SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={`cat_${cat.id}`} value={`cat_${cat.id}`}>
                      {cat.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="label_sectors" disabled>
                    Sectors
                  </SelectItem>
                  {sectors.map((sec) => (
                    <SelectItem key={`sec_${sec.id}`} value={`sec_${sec.id}`}>
                      {sec.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Bottom left: Show expenses for checkboxes */}
            <div className="flex flex-col w-full md:col-start-1 md:row-start-2">
              <Label className="mb-1">Show Data for</Label>
              <div className="flex gap-4">
                {userNames && userNames.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="filterUser1"
                      checked={personInvolvementFilter.user1}
                      onCheckedChange={(checked) =>
                        setPersonInvolvementFilter((prev) => ({
                          ...prev,
                          user1: !!checked,
                        }))
                      }
                      className="dashboard-filter-checkbox"
                    />
                    <Label htmlFor="filterUser1">{userNames[0]}</Label>
                  </div>
                )}
                {userNames && userNames.length > 1 && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="filterUser2"
                      checked={personInvolvementFilter.user2}
                      onCheckedChange={(checked) =>
                        setPersonInvolvementFilter((prev) => ({
                          ...prev,
                          user2: !!checked,
                        }))
                      }
                      className="dashboard-filter-checkbox"
                    />
                    <Label htmlFor="filterUser2">{userNames[1]}</Label>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="filterShared"
                    checked={personInvolvementFilter.shared}
                    onCheckedChange={(checked) =>
                      setPersonInvolvementFilter((prev) => ({
                        ...prev,
                        shared: !!checked,
                      }))
                    }
                    className="dashboard-filter-checkbox"
                  />
                  <Label htmlFor="filterShared">Shared</Label>
                </div>
              </div>
            </div>
            {/* Bottom right: Description filter */}
            <div className="flex flex-col w-full md:col-start-2 md:row-start-2">
              <Label htmlFor="descriptionFilter" className="mb-1">
                Filter by Description
              </Label>
              <Input
                type="text"
                id="descriptionFilter"
                value={descriptionFilter}
                onChange={(e) => setDescriptionFilter(e.target.value)}
                placeholder="Search description..."
                className="h-9 rounded-md px-3 py-2 bg-background text-sm appearance-none w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <BalanceSummary
        transactionsInDateRange={transactionsInDateRange}
        showValues={showValues}
      />
      <ExpensesIncomeNetWidget
        transactionsInDateRange={effectiveTransactions.filter((t) => {
          // Apply the same filters as expensesForWidgetsFiltered, but allow all transaction types
          if (categorySectorFilter === "all") {
            return (
              !descriptionFilter ||
              (t.description &&
                t.description
                  .toLowerCase()
                  .includes(descriptionFilter.toLowerCase()))
            );
          }
          const [filterType, filterId] = categorySectorFilter.split("_");
          const type = t.transaction_type || "expense";
          const categoryToMatch =
            t.category_name_for_reimbursement_logic || t.category_name;
          if (!categoryToMatch || categoryToMatch.trim() === "") return false;
          if (
            descriptionFilter &&
            (!t.description ||
              !t.description
                .toLowerCase()
                .includes(descriptionFilter.toLowerCase()))
          ) {
            return false;
          }
          if (filterType === "cat") {
            const selectedCategory = categories.find(
              (c) => c.id === (filterId as string)
            );
            return (
              selectedCategory && categoryToMatch === selectedCategory.name
            );
          }
          if (filterType === "sec") {
            const selectedSector = sectors.find(
              (s) => s.id === (filterId as string)
            );
            if (!selectedSector || !selectedSector.category_ids) return false;
            const categoryNamesInSector = selectedSector.category_ids
              .map(
                (catId: string) => categories.find((c) => c.id === catId)?.name
              )
              .filter((name: string | undefined): name is string => !!name);
            return (
              categoryToMatch && categoryNamesInSector.includes(categoryToMatch)
            );
          }
          return true;
        })}
        // Pass all transactions for trend calculation
        context={{
          userNames,
          personInvolvementFilter,
          allTransactions: allTransactionsState,
        }}
        showValues={showValues}
      />
      <div className="mb-8">
        <CategoryBreakdownWidget
          transactionsInDateRange={expensesForWidgetsFiltered}
        />
        {/* Pie chart for sector/category breakdown */}
        <SectorCategoryPieChart
          transactionsInDateRange={expensesForWidgetsFiltered}
          categories={categories}
          sectors={sectors}
          showValues={showValues}
        />
      </div>
      <TransactionList
        className="mt-0"
        transactions={finalFilteredTransactionsForDisplay}
        deleteTransaction={deleteTransaction}
        showValues={showValues}
      />
    </div>
  );
};

export default DashboardPage;
