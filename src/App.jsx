// src/App.jsx
import { Outlet, Link } from "react-router-dom";
import { useState, useCallback, useEffect } from "react";
import { supabase } from "./supabaseClient";
import "./App.css";

function App() {
  const [transactions, setTransactions] = useState([]);
  const [userNames, setUserNames] = useState([]);
  const [categories, setCategories] = useState([]); // Now: [{ id, name }, ...]
  const [sectors, setSectors] = useState([]); // Now: [{ id, name, category_ids: [...] }, ...]
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Data Fetching ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch App Settings (User Names)
        let { data: appSettings, error: settingsError } = await supabase
          .from("app_settings")
          .select("key, value");
        if (settingsError) throw settingsError;
        let fetchedUser1Name = "User 1",
          fetchedUser2Name = "User 2";
        if (appSettings) {
          const u1 = appSettings.find((s) => s.key === "user1_name");
          const u2 = appSettings.find((s) => s.key === "user2_name");
          if (u1) fetchedUser1Name = u1.value;
          if (u2) fetchedUser2Name = u2.value;
        }
        setUserNames([fetchedUser1Name, fetchedUser2Name]);

        // 2. Fetch Categories (now fetching id and name)
        let { data: fetchedCategories, error: categoriesError } = await supabase
          .from("categories")
          .select("id, name")
          .order("name", { ascending: true });
        if (categoriesError) throw categoriesError;
        setCategories(fetchedCategories || []);

        // 3. Fetch Sectors
        let { data: fetchedSectors, error: sectorsError } = await supabase
          .from("sectors")
          .select("id, name")
          .order("name", { ascending: true });
        if (sectorsError) throw sectorsError;

        // 4. Fetch Sector-Category relationships and map to sectors
        let { data: sectorCategoryLinks, error: scError } = await supabase
          .from("sector_categories")
          .select("sector_id, category_id");
        if (scError) throw scError;

        const sectorsWithCategories = (fetchedSectors || []).map((sector) => ({
          ...sector,
          category_ids: (sectorCategoryLinks || [])
            .filter((link) => link.sector_id === sector.id)
            .map((link) => link.category_id),
        }));
        setSectors(sectorsWithCategories);

        // 5. Fetch Transactions
        let { data: fetchedTransactions, error: transactionsError } =
          await supabase
            .from("transactions")
            .select("*")
            .order("date", { ascending: false });
        if (transactionsError) throw transactionsError;
        // IMPORTANT: Ensure transactions store category_id (UUID) not category_name
        // If your 'transactions' table stores 'category_name', you'll need to adjust how you link/filter
        // For now, assuming 'category_name' is still used in transactions for simplicity of this step,
        // but ideally, transactions.category_id would reference categories.id
        setTransactions(fetchedTransactions || []);
      } catch (err) {
        // Changed error variable name
        console.error("Error fetching initial data:", err);
        setError(err.message || "Failed to fetch data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- Transaction CRUD (Ensure category_name is used if that's what transactions table stores) ---
  const addTransaction = useCallback(async (newTransactionData) => {
    try {
      const transactionToInsert = {
        date: newTransactionData.date,
        description: newTransactionData.description,
        amount: newTransactionData.amount,
        // Assuming transactions table uses category_name. If it uses category_id, this needs to change.
        category_name: newTransactionData.category, // This is a category NAME
        paid_by_user_name: newTransactionData.paidBy,
        split_type: newTransactionData.splitType,
      };
      const { data, error } = await supabase
        .from("transactions")
        .insert([transactionToInsert])
        .select();
      if (error) throw error;
      if (data && data.length > 0)
        setTransactions((prev) =>
          [data[0], ...prev].sort((a, b) => new Date(b.date) - new Date(a.date))
        );
    } catch (err) {
      console.error("Error adding transaction:", err);
      alert(`Error: ${err.message}`);
    }
  }, []);

  const updateTransaction = useCallback(async (updatedTransactionData) => {
    try {
      const transactionToUpdate = {
        date: updatedTransactionData.date,
        description: updatedTransactionData.description,
        amount: updatedTransactionData.amount,
        category_name: updatedTransactionData.category, // This is a category NAME
        paid_by_user_name: updatedTransactionData.paidBy,
        split_type: updatedTransactionData.splitType,
      };
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
            .sort((a, b) => new Date(b.date) - new Date(a.date))
        );
      }
      setEditingTransaction(null);
    } catch (err) {
      console.error("Error updating transaction:", err);
      alert(`Error: ${err.message}`);
    }
  }, []);

  const deleteTransaction = useCallback(async (transactionId) => {
    /* ... remains same ... */
    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", transactionId);
      if (error) throw error;
      setTransactions((prev) => prev.filter((t) => t.id !== transactionId));
    } catch (err) {
      console.error("Error deleting transaction:", err);
      alert(`Error: ${err.message}`);
    }
  }, []);

  // --- Settings CRUD ---
  const updateUserNames = useCallback(async (n1, n2) => {
    /* ... remains same ... */
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
      console.error("Error updating user names:", err);
      alert(`Error: ${err.message}`);
    }
  }, []);

  const addCategory = useCallback(
    async (newCategoryName) => {
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
        console.error("Error adding category:", err);
        alert(`Error: ${err.message}`);
      }
    },
    [categories]
  );

  const deleteCategory = useCallback(async (categoryToDelete) => {
    // Now categoryToDelete is an object {id, name}
    try {
      const { count, error: countError } = await supabase
        .from("transactions")
        .select("id", { count: "exact", head: true })
        .eq("category_name", categoryToDelete.name); // Still checking by name
      if (countError) throw countError;
      if (count > 0) {
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
      console.error("Error deleting category:", err);
      alert(`Error: ${err.message}`);
    }
  }, []);

  // --- Sector CRUD ---
  const addSector = useCallback(
    async (sectorName) => {
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
          const newSector = { ...data[0], category_ids: [] };
          setSectors((prev) =>
            [...prev, newSector].sort((a, b) => a.name.localeCompare(b.name))
          );
          return newSector; // Return the new sector object
        }
        return null;
      } catch (err) {
        console.error("Error adding sector:", err);
        alert(`Error: ${err.message}`);
        return null;
      }
    },
    [sectors]
  );

  const deleteSector = useCallback(async (sectorId) => {
    try {
      // Deleting a sector will also delete its links in sector_categories due to ON DELETE CASCADE
      const { error } = await supabase
        .from("sectors")
        .delete()
        .eq("id", sectorId);
      if (error) throw error;
      setSectors((prev) => prev.filter((s) => s.id !== sectorId));
      alert("Sector deleted.");
    } catch (err) {
      console.error("Error deleting sector:", err);
      alert(`Error: ${err.message}`);
    }
  }, []);

  const addCategoryToSector = useCallback(
    async (sectorId, categoryId) => {
      try {
        // Check if link already exists to prevent duplicates if DB constraint fails silently
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
        console.error("Error adding category to sector:", err);
        alert(`Error: ${err.message}`);
      }
    },
    [sectors]
  );

  const removeCategoryFromSector = useCallback(async (sectorId, categoryId) => {
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
                category_ids: s.category_ids.filter((id) => id !== categoryId),
              }
            : s
        )
      );
    } catch (err) {
      console.error("Error removing category from sector:", err);
      alert(`Error: ${err.message}`);
    }
  }, []);

  const handleSetEditingTransaction = useCallback(
    (transaction) => setEditingTransaction(transaction),
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

  const contextValue = {
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
}

export default App;
