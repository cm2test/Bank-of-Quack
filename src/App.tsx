// src/App.jsx
import { Outlet, Link } from "react-router-dom";
import { useState, useCallback, useEffect } from "react";
import { supabase } from "./supabaseClient";
import "./App.css";
import React from "react";

// Type definitions
export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  paid_by_user_name: string;
  transaction_type: string;
  category_name: string | null;
  split_type: string | null;
  paid_to_user_name?: string | null;
  reimburses_transaction_id?: string | null;
}

export interface Category {
  id: string;
  name: string;
}

export interface Sector {
  id: string;
  name: string;
  category_ids: string[];
}

export interface AppContext {
  transactions: Transaction[];
  addTransaction: (t: Partial<Transaction>) => void;
  userNames: string[];
  updateUserNames: (n1: string, n2: string) => void;
  categories: Category[];
  addCategory: (name: string) => void;
  deleteCategory: (cat: Category) => void;
  editingTransaction: Transaction | null;
  handleSetEditingTransaction: (t: Transaction | null) => void;
  updateTransaction: (t: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  sectors: Sector[];
  addSector: (name: string) => Promise<Sector | null>;
  deleteSector: (id: string) => void;
  addCategoryToSector: (sectorId: string, categoryId: string) => void;
  removeCategoryFromSector: (sectorId: string, categoryId: string) => void;
}

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userNames, setUserNames] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // --- Data Fetching (ensure this is up-to-date from app_jsx_with_sectors) ---
  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        // User Names, Categories, Sectors fetching remains the same...
        let { data: appSettings, error: settingsError } = await supabase
          .from("app_settings")
          .select("key, value");
        if (settingsError) throw settingsError;
        let fetchedUser1Name = "User 1",
          fetchedUser2Name = "User 2";
        if (appSettings) {
          const u1 = appSettings.find((s: any) => s.key === "user1_name");
          const u2 = appSettings.find((s: any) => s.key === "user2_name");
          if (u1) fetchedUser1Name = u1.value;
          if (u2) fetchedUser2Name = u2.value;
        }
        setUserNames([fetchedUser1Name, fetchedUser2Name]);

        let { data: fetchedCategories, error: categoriesError } = await supabase
          .from("categories")
          .select("id, name")
          .order("name", { ascending: true });
        if (categoriesError) throw categoriesError;
        setCategories(fetchedCategories || []);

        let { data: fetchedSectors, error: sectorsError } = await supabase
          .from("sectors")
          .select("id, name")
          .order("name", { ascending: true });
        if (sectorsError) throw sectorsError;
        let { data: sectorCategoryLinks, error: scError } = await supabase
          .from("sector_categories")
          .select("sector_id, category_id");
        if (scError) throw scError;
        const sectorsWithCategories = (fetchedSectors || []).map(
          (sector: any) => ({
            ...sector,
            category_ids: (sectorCategoryLinks || [])
              .filter((link: any) => link.sector_id === sector.id)
              .map((link: any) => link.category_id),
          })
        );
        setSectors(sectorsWithCategories);

        // Transactions (will now include reimburses_transaction_id)
        let { data: fetchedTransactions, error: transactionsError } =
          await supabase
            .from("transactions")
            .select("*")
            .order("date", { ascending: false });
        if (transactionsError) throw transactionsError;
        setTransactions(fetchedTransactions || []);
      } catch (err) {
        const error = err as Error;
        console.error("Error fetching initial data:", error);
        setError(error.message || "Failed to fetch data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- Transaction CRUD ---
  const addTransaction = useCallback(
    async (newTransactionData: Partial<Transaction>): Promise<void> => {
      try {
        const transactionToInsert: any = {
          date: newTransactionData.date,
          description: newTransactionData.description,
          amount: newTransactionData.amount,
          paid_by_user_name: newTransactionData.paid_by_user_name, // Who paid or received
          transaction_type: newTransactionData.transaction_type || "expense",
          // Nullable fields by default
          category_name: null,
          split_type: null,
          paid_to_user_name: null,
          reimburses_transaction_id:
            newTransactionData.reimburses_transaction_id || null,
        };

        if (transactionToInsert.transaction_type === "expense") {
          transactionToInsert.category_name = newTransactionData.category_name;
          transactionToInsert.split_type = newTransactionData.split_type;
        } else if (transactionToInsert.transaction_type === "settlement") {
          transactionToInsert.category_name = "Settlement" as any; // Or keep null
          transactionToInsert.paid_to_user_name =
            newTransactionData.paid_to_user_name;
        }
        // For 'income' and 'reimbursement', category_name is already null by default.
        // reimburses_transaction_id is handled by its presence in newTransactionData.

        const { data, error } = await supabase
          .from("transactions")
          .insert([transactionToInsert])
          .select();
        if (error) throw error;
        if (data && data.length > 0) {
          setTransactions((prev) =>
            [data[0], ...prev].sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            )
          );
        }
      } catch (err) {
        const error = err as Error;
        console.error("Error adding transaction:", error);
        alert(`Error: ${error.message}`);
      }
    },
    []
  );

  const updateTransaction = useCallback(
    async (updatedTransactionData: Partial<Transaction>): Promise<void> => {
      try {
        const transactionToUpdate: any = {
          date: updatedTransactionData.date,
          description: updatedTransactionData.description,
          amount: updatedTransactionData.amount,
          paid_by_user_name: updatedTransactionData.paid_by_user_name,
          transaction_type:
            updatedTransactionData.transaction_type || "expense",
          category_name: null,
          split_type: null,
          paid_to_user_name: null,
          reimburses_transaction_id:
            updatedTransactionData.reimburses_transaction_id || null,
        };

        if (transactionToUpdate.transaction_type === "expense") {
          transactionToUpdate.category_name =
            updatedTransactionData.category_name;
          transactionToUpdate.split_type = updatedTransactionData.split_type;
        } else if (transactionToUpdate.transaction_type === "settlement") {
          transactionToUpdate.category_name = "Settlement" as any; // Or keep null
          transactionToUpdate.paid_to_user_name =
            updatedTransactionData.paid_to_user_name;
        }

        const { data, error } = await supabase
          .from("transactions")
          .update(transactionToUpdate)
          .eq("id", updatedTransactionData.id)
          .select();
        if (error) throw error;
        if (data && data.length > 0) {
          setTransactions((prev) =>
            prev
              .map((t) => (t.id === data[0].id ? data[0] : t))
              .sort(
                (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime()
              )
          );
        }
        setEditingTransaction(null);
      } catch (err) {
        const error = err as Error;
        console.error("Error updating transaction:", error);
        alert(`Error: ${error.message}`);
      }
    },
    []
  );

  // deleteTransaction, updateUserNames, addCategory, deleteCategory, sector CRUD, handleSetEditingTransaction remain the same
  // ... (ensure these are correctly implemented from previous versions) ...
  const deleteTransaction = useCallback(
    async (transactionId: string): Promise<void> => {
      try {
        const { error } = await supabase
          .from("transactions")
          .delete()
          .eq("id", transactionId);
        if (error) throw error;
        setTransactions((prev) => prev.filter((t) => t.id !== transactionId));
      } catch (err) {
        const error = err as Error;
        console.error("Error deleting transaction:", error);
        alert(`Error: ${error.message}`);
      }
    },
    []
  );

  const updateUserNames = useCallback(
    async (n1: string, n2: string): Promise<void> => {
      try {
        await supabase
          .from("app_settings")
          .update({ value: n1 })
          .eq("key", "user1_name");
        await supabase
          .from("app_settings")
          .update({ value: n2 })
          .eq("key", "user2_name");
        setUserNames([n1, n2]);
      } catch (err) {
        const error = err as Error;
        console.error("Error updating user names:", error);
        alert(`Error: ${error.message}`);
      }
    },
    []
  );

  const addCategory = useCallback(
    async (newCategoryName: string): Promise<void> => {
      if (
        !newCategoryName ||
        categories.find((c) => c.name === newCategoryName)
      ) {
        if (categories.find((c) => c.name === newCategoryName))
          alert("Category already exists.");
        return;
      }
      try {
        const { data, error } = await supabase
          .from("categories")
          .insert([{ name: newCategoryName }])
          .select();
        if (error) throw error;
        if (data && data.length > 0)
          setCategories((prev) =>
            [...prev, data[0]].sort((a, b) => a.name.localeCompare(b.name))
          );
      } catch (err) {
        const error = err as Error;
        console.error("Error adding category:", error);
        alert(`Error: ${error.message}`);
      }
    },
    [categories]
  );

  const deleteCategory = useCallback(
    async (categoryToDelete: Category): Promise<void> => {
      try {
        const { count, error: countError } = await supabase
          .from("transactions")
          .select("id", { count: "exact", head: true })
          .eq("category_name", categoryToDelete.name);
        if (countError) throw countError;
        if ((count ?? 0) > 0) {
          alert(
            `Cannot delete category "${categoryToDelete.name}" as it's used by ${count} transaction(s).`
          );
          return;
        }
        const { error } = await supabase
          .from("categories")
          .delete()
          .eq("id", categoryToDelete.id);
        if (error) throw error;
        setCategories((prev) =>
          prev.filter((cat) => cat.id !== categoryToDelete.id)
        );
        alert(`Category "${categoryToDelete.name}" deleted.`);
      } catch (err) {
        const error = err as Error;
        console.error("Error deleting category:", error);
        alert(`Error: ${error.message}`);
      }
    },
    []
  );

  const addSector = useCallback(
    async (sectorName: string): Promise<Sector | null> => {
      if (!sectorName || sectors.find((s) => s.name === sectorName)) {
        if (sectors.find((s) => s.name === sectorName))
          alert("Sector already exists.");
        return null;
      }
      try {
        const { data, error } = await supabase
          .from("sectors")
          .insert([{ name: sectorName }])
          .select();
        if (error) throw error;
        if (data && data.length > 0) {
          const newSector: Sector = { ...data[0], category_ids: [] };
          setSectors((prev) =>
            [...prev, newSector].sort((a, b) => a.name.localeCompare(b.name))
          );
          return newSector;
        }
        return null;
      } catch (err) {
        const error = err as Error;
        console.error("Error adding sector:", error);
        alert(`Error: ${error.message}`);
        return null;
      }
    },
    [sectors]
  );

  const deleteSector = useCallback(async (sectorId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from("sectors")
        .delete()
        .eq("id", sectorId);
      if (error) throw error;
      setSectors((prev) => prev.filter((s) => s.id !== sectorId));
      alert("Sector deleted.");
    } catch (err) {
      const error = err as Error;
      console.error("Error deleting sector:", error);
      alert(`Error: ${error.message}`);
    }
  }, []);

  const addCategoryToSector = useCallback(
    async (sectorId: string, categoryId: string): Promise<void> => {
      try {
        const currentSector = sectors.find((s) => s.id === sectorId);
        if (currentSector && currentSector.category_ids.includes(categoryId)) {
          alert("Category already in this sector.");
          return;
        }
        const { data, error } = await supabase
          .from("sector_categories")
          .insert([{ sector_id: sectorId, category_id: categoryId }])
          .select();
        if (error) throw error;
        if (data && data.length > 0) {
          setSectors((prevSectors) =>
            prevSectors.map((s) =>
              s.id === sectorId
                ? { ...s, category_ids: [...s.category_ids, categoryId] }
                : s
            )
          );
        }
      } catch (err) {
        const error = err as Error;
        console.error("Error adding category to sector:", error);
        alert(`Error: ${error.message}`);
      }
    },
    [sectors]
  );

  const removeCategoryFromSector = useCallback(
    async (sectorId: string, categoryId: string): Promise<void> => {
      try {
        const { error } = await supabase
          .from("sector_categories")
          .delete()
          .match({ sector_id: sectorId, category_id: categoryId });
        if (error) throw error;
        setSectors((prevSectors) =>
          prevSectors.map((s) =>
            s.id === sectorId
              ? {
                  ...s,
                  category_ids: s.category_ids.filter(
                    (id) => id !== categoryId
                  ),
                }
              : s
          )
        );
      } catch (err) {
        const error = err as Error;
        console.error("Error removing category from sector:", error);
        alert(`Error: ${error.message}`);
      }
    },
    []
  );

  const handleSetEditingTransaction = useCallback(
    (transaction: Transaction | null) => setEditingTransaction(transaction),
    []
  );

  if (loading) return <div>Loading application data...</div>;
  if (error)
    return (
      <div style={{ color: "red" }}>
        Error: {error}{" "}
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );

  const contextValue: AppContext = {
    transactions,
    addTransaction,
    userNames,
    updateUserNames,
    categories,
    addCategory,
    deleteCategory,
    editingTransaction,
    handleSetEditingTransaction,
    updateTransaction,
    deleteTransaction,
    sectors,
    addSector,
    deleteSector,
    addCategoryToSector,
    removeCategoryFromSector,
  };

  return (
    <>
      <nav>
        <ul>
          <li>
            <Link to="/">Dashboard</Link>
          </li>
          <li>
            <Link to="/transactions">Transactions</Link>
          </li>
          <li>
            <Link to="/settings">Settings</Link>
          </li>
        </ul>
      </nav>
      <hr />
      <main>
        <Outlet context={contextValue} />
      </main>
    </>
  );
};

export default App;
