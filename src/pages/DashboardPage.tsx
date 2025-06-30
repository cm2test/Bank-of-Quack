// src/pages/DashboardPage.tsx
import React, { useState, useMemo, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Filter as FilterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import BottomNavBar from "@/components/dashboard/BottomNavBar";
import BalanceSummary from "../components/dashboard/BalanceSummary";
import ExpensesIncomeNetWidget from "../components/dashboard/TotalExpensesWidget";
import TransactionList from "../components/TransactionList";
import SectorCategoryPieChart from "../components/dashboard/SectorCategoryPieChart";
import FilterSheet from "../components/dashboard/FilterSheet";
import { useTransactionFilters } from "../hooks/useTransactionFilters";
import { Transaction, Category, Sector } from "@/types";

interface DashboardPageContext {
  transactions: Transaction[];
  userNames: string[];
  categories: Category[];
  sectors: Sector[];
  sectorCategoryEmptyStateImageUrl?: string;
  incomeImageUrl?: string;
  settlementImageUrl?: string;
  reimbursementImageUrl?: string;
  deleteTransaction: (id: string) => Promise<void>;
  user1AvatarUrl?: string | null;
  user2AvatarUrl?: string | null;
  handleSetEditingTransaction: (transaction: Transaction) => void;
  fabOpen: boolean;
}

const DashboardPage: React.FC = () => {
  const {
    transactions,
    userNames,
    categories,
    sectors,
    sectorCategoryEmptyStateImageUrl,
    incomeImageUrl,
    settlementImageUrl,
    reimbursementImageUrl,
    deleteTransaction,
    user1AvatarUrl,
    user2AvatarUrl,
    handleSetEditingTransaction,
    fabOpen,
  } = useOutletContext<DashboardPageContext>();

  useEffect(() => {
    // Set the value once on mount and don't update on resize.
    // This prevents the jumpy behavior on mobile when the address bar hides.
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  }, []);

  const {
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    personInvolvementFilter,
    setPersonInvolvementFilter,
    categorySectorFilter,
    setCategorySectorFilter,
    descriptionFilter,
    setDescriptionFilter,
    filteredTransactions,
    isFiltered,
  } = useTransactionFilters(transactions, categories, sectors, userNames);

  const [showValues, setShowValues] = useState(() => {
    const stored = localStorage.getItem("dashboard_show_values");
    return stored === null ? true : stored === "true";
  });

  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  React.useEffect(() => {
    localStorage.setItem("dashboard_show_values", showValues.toString());
  }, [showValues]);

  if (!transactions) return <div>Loading...</div>;

  const expenseTransactions = filteredTransactions.filter(
    (t) => t.transaction_type === "expense"
  );

  return (
    <div className="bg-gradient-to-b from-[#004D40] to-[#26A69A] text-gray-200 min-h-[calc(var(--vh,1vh)*100)]">
      <div className="relative h-[calc(var(--vh,1vh)*50)] flex items-center justify-center text-center">
        <img
          src="/BankerQuack.png"
          alt="Banker Quack"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none object-[center_30%] sm:object-center z-0"
        />
        <div className="absolute inset-0 bg-black/30 z-0" />
        <h1
          className="text-6xl md:text-8xl font-bold text-yellow-100 z-10"
          style={{
            fontFamily: "'Dancing Script', cursive",
            textShadow: "2px 2px 8px rgba(0,0,0,0.7)",
          }}
        >
          Bank of Quack
        </h1>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsFilterSheetOpen(true)}
        className={cn(
          "fixed bottom-28 right-4 z-[60] bg-black/30 text-white rounded-full w-14 h-14 hover:bg-black/50 transition-all duration-300",
          isFiltered && "border-2 border-yellow-400",
          fabOpen && "translate-y-24 opacity-0 pointer-events-none"
        )}
      >
        <FilterIcon />
      </Button>

      <FilterSheet
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        descriptionFilter={descriptionFilter}
        setDescriptionFilter={setDescriptionFilter}
        personInvolvementFilter={personInvolvementFilter}
        setPersonInvolvementFilter={setPersonInvolvementFilter}
        userNames={userNames}
        categorySectorFilter={categorySectorFilter}
        setCategorySectorFilter={setCategorySectorFilter}
        categories={categories}
        sectors={sectors}
        isOpen={isFilterSheetOpen}
        setIsOpen={setIsFilterSheetOpen}
      />

      <div className="max-w-4xl mx-auto w-full p-4 relative z-20">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Dashboard</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowValues((prev) => !prev)}
              className="text-white hover:bg-white/10"
            >
              {showValues ? <EyeOff /> : <Eye />}
            </Button>
          </div>
        </div>
        <div className="space-y-4">
          <BalanceSummary
            transactions={filteredTransactions}
            allTransactions={transactions}
            userNames={userNames}
            user1AvatarUrl={user1AvatarUrl || null}
            user2AvatarUrl={user2AvatarUrl || null}
            showValues={showValues}
          />
          <ExpensesIncomeNetWidget
            transactions={filteredTransactions}
            allTransactions={transactions}
            userNames={userNames}
            showValues={showValues}
            personInvolvementFilter={personInvolvementFilter}
          />
          <SectorCategoryPieChart
            sectors={sectors}
            categories={categories}
            transactions={filteredTransactions}
            allTransactions={transactions}
            emptyStateImageUrl={sectorCategoryEmptyStateImageUrl}
            showValues={showValues}
            deleteTransaction={deleteTransaction}
            userNames={userNames}
            incomeImageUrl={incomeImageUrl}
            settlementImageUrl={settlementImageUrl}
            reimbursementImageUrl={reimbursementImageUrl}
            handleSetEditingTransaction={handleSetEditingTransaction}
            personInvolvementFilter={personInvolvementFilter}
          />
          <Card>
            <CardContent className="pt-6">
              <TransactionList
                transactions={filteredTransactions}
                categories={categories}
                userNames={userNames}
                showValues={showValues}
                incomeImageUrl={incomeImageUrl}
                settlementImageUrl={settlementImageUrl}
                reimbursementImageUrl={reimbursementImageUrl}
                deleteTransaction={deleteTransaction}
                handleSetEditingTransaction={handleSetEditingTransaction}
                allTransactions={transactions}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
