import { useState, useMemo } from "react";
import {
  formatDateForInput,
  getFirstDayOfMonth,
  getLastDayOfMonth,
  parseInputDateLocal,
} from "@/utils/dateUtils";
import { Transaction, Category, Sector } from "@/types";

export const useTransactionFilters = (
  allTransactions: Transaction[],
  categories: Category[],
  sectors: Sector[],
  userNames: string[]
) => {
  const defaults = useMemo(() => {
    const now = new Date();
    return {
      startDate: formatDateForInput(getFirstDayOfMonth(now)),
      endDate: formatDateForInput(getLastDayOfMonth(now)),
      personInvolvement: { user1: true, user2: true, shared: true },
      categorySector: "all",
      description: "",
    };
  }, []);

  const [startDate, setStartDate] = useState<string>(defaults.startDate);
  const [endDate, setEndDate] = useState<string>(defaults.endDate);
  const [personInvolvementFilter, setPersonInvolvementFilter] = useState(
    defaults.personInvolvement
  );
  const [categorySectorFilter, setCategorySectorFilter] = useState<string>(
    defaults.categorySector
  );
  const [descriptionFilter, setDescriptionFilter] = useState(
    defaults.description
  );

  const isFiltered = useMemo(() => {
    return (
      startDate !== defaults.startDate ||
      endDate !== defaults.endDate ||
      personInvolvementFilter.user1 !== defaults.personInvolvement.user1 ||
      personInvolvementFilter.user2 !== defaults.personInvolvement.user2 ||
      personInvolvementFilter.shared !== defaults.personInvolvement.shared ||
      categorySectorFilter !== defaults.categorySector ||
      descriptionFilter !== defaults.description
    );
  }, [
    startDate,
    endDate,
    personInvolvementFilter,
    categorySectorFilter,
    descriptionFilter,
    defaults,
  ]);

  const filteredTransactions = useMemo<Transaction[]>(() => {
    if (!allTransactions) return [];

    // 2. Apply all filters
    const start = parseInputDateLocal(startDate);
    const end = parseInputDateLocal(endDate);
    end.setHours(23, 59, 59, 999);

    return allTransactions.filter((t) => {
      // Date filter
      const transactionDate = parseInputDateLocal(t.date);
      if (
        isNaN(transactionDate.getTime()) ||
        transactionDate < start ||
        transactionDate > end
      ) {
        return false;
      }

      // Description filter
      if (
        descriptionFilter &&
        !t.description.toLowerCase().includes(descriptionFilter.toLowerCase())
      ) {
        return false;
      }

      // Person Involvement & Category/Sector Filters by Type
      switch (t.transaction_type) {
        case "expense": {
          const isForUser1 = t.split_type === "user1_only";
          const isForUser2 = t.split_type === "user2_only";
          const isShared = t.split_type === "splitEqually";

          const personMatch =
            (personInvolvementFilter.user1 && isForUser1) ||
            (personInvolvementFilter.user2 && isForUser2) ||
            (personInvolvementFilter.shared && isShared);

          if (!personMatch) return false;

          // Category/Sector filter (only for expenses)
          if (categorySectorFilter !== "all") {
            if (
              categorySectorFilter === "uncategorized" &&
              (t.category_id === null || !t.category_id)
            ) {
              // This is an uncategorized transaction, keep it.
            } else {
              const sector = sectors.find((s) => s.id === categorySectorFilter);
              if (sector) {
                if (!sector.category_ids.includes(t.category_id || ""))
                  return false;
              } else {
                if (t.category_id !== categorySectorFilter) return false;
              }
            }
          }
          return true;
        }
        case "income":
        case "reimbursement": {
          const receivedByUser1 = t.paid_to_user_name === userNames[0];
          const receivedByUser2 = t.paid_to_user_name === userNames[1];
          const receivedByShared = t.paid_to_user_name === "Shared";

          if (personInvolvementFilter.user1 && receivedByUser1) return true;
          if (personInvolvementFilter.user2 && receivedByUser2) return true;
          if (personInvolvementFilter.shared && receivedByShared) return true;

          return false;
        }
        case "settlement": {
          const involvesUser1 =
            t.paid_by_user_name === userNames[0] ||
            t.paid_to_user_name === userNames[0];
          const involvesUser2 =
            t.paid_by_user_name === userNames[1] ||
            t.paid_to_user_name === userNames[1];

          if (
            (personInvolvementFilter.user1 && involvesUser1) ||
            (personInvolvementFilter.user2 && involvesUser2)
          ) {
            return true;
          }

          return false;
        }
        default:
          return true; // Keep any other transaction types not covered
      }
    });
  }, [
    allTransactions,
    startDate,
    endDate,
    personInvolvementFilter,
    categorySectorFilter,
    descriptionFilter,
    categories,
    sectors,
    userNames,
  ]);

  return {
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
  };
};
