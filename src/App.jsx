// src/App.jsx
import { Outlet, Link } from "react-router-dom";
import { useState, useCallback, useEffect } from "react";
import { supabase } from "./supabaseClient"; // Correct import for supabase client
import "./App.css"; // Correct import for App.css

// NO import for '../utils/dateUtils' should be here

function App() {
  const [transactions, setTransactions] = useState([]);
  const [userNames, setUserNames] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Data Fetching ---
  useEffect(() => {
    const fetchData = async () => {
      console.log("Attempting to fetch initial data...");
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch App Settings (User Names)
        console.log("Fetching app settings...");
        let { data: appSettings, error: settingsError } = await supabase
          .from("app_settings")
          .select("key, value");
        if (settingsError) {
          console.error("Settings fetch error:", settingsError);
          throw settingsError;
        }
        console.log("App settings fetched:", appSettings);
        let fetchedUser1Name = "User 1"; // Default
        let fetchedUser2Name = "User 2"; // Default
        if (appSettings) {
          const user1Setting = appSettings.find((s) => s.key === "user1_name");
          const user2Setting = appSettings.find((s) => s.key === "user2_name");
          if (user1Setting) fetchedUser1Name = user1Setting.value;
          if (user2Setting) fetchedUser2Name = user2Setting.value;
        }
        setUserNames([fetchedUser1Name, fetchedUser2Name]);
        console.log("User names set:", [fetchedUser1Name, fetchedUser2Name]);

        // 2. Fetch Categories
        console.log("Fetching categories...");
        let { data: fetchedCategories, error: categoriesError } = await supabase
          .from("categories")
          .select("name")
          .order("name", { ascending: true });
        if (categoriesError) {
          console.error("Categories fetch error:", categoriesError);
          throw categoriesError;
        }
        console.log("Categories fetched:", fetchedCategories);
        setCategories(
          fetchedCategories ? fetchedCategories.map((c) => c.name) : []
        );
        console.log(
          "Categories set:",
          fetchedCategories ? fetchedCategories.map((c) => c.name) : []
        );

        // 3. Fetch Transactions
        console.log("Fetching transactions...");
        let { data: fetchedTransactions, error: transactionsError } =
          await supabase
            .from("transactions")
            .select("*")
            .order("date", { ascending: false });
        if (transactionsError) {
          console.error("Transactions fetch error:", transactionsError);
          throw transactionsError;
        }
        console.log("Transactions fetched from Supabase:", fetchedTransactions);
        setTransactions(fetchedTransactions || []);
        console.log(
          "Local transactions state updated with:",
          fetchedTransactions || []
        );
      } catch (error) {
        console.error("Error in fetchData function:", error);
        setError(error.message || "Failed to fetch data. Please try again.");
      } finally {
        setLoading(false);
        console.log("Finished fetching initial data. Loading set to false.");
      }
    };
    fetchData();
  }, []); // Empty dependency array means this runs once when the component mounts

  // --- Transaction CRUD ---
  const addTransaction = useCallback(async (newTransactionData) => {
    try {
      const transactionToInsert = {
        date: newTransactionData.date,
        description: newTransactionData.description,
        amount: newTransactionData.amount,
        category_name: newTransactionData.category, // Ensure field name matches DB
        paid_by_user_name: newTransactionData.paidBy, // Ensure field name matches DB
        split_type: newTransactionData.splitType,
      };

      const { data, error: insertError } = await supabase // Renamed 'error' to 'insertError' for clarity
        .from("transactions")
        .insert([transactionToInsert])
        .select(); // .select() returns the inserted row(s)

      if (insertError) throw insertError;

      if (data && data.length > 0) {
        setTransactions((prev) =>
          [data[0], ...prev].sort((a, b) => new Date(b.date) - new Date(a.date))
        ); // Keep sorted
      }
    } catch (error) {
      // This will catch errors from the try block, including thrown insertError
      console.error("Error adding transaction:", error);
      alert(`Error adding transaction: ${error.message}`);
    }
  }, []);

  const updateTransaction = useCallback(async (updatedTransactionData) => {
    try {
      const transactionToUpdate = {
        // id is used to identify the row, not updated itself
        date: updatedTransactionData.date,
        description: updatedTransactionData.description,
        amount: updatedTransactionData.amount,
        category_name: updatedTransactionData.category,
        paid_by_user_name: updatedTransactionData.paidBy,
        split_type: updatedTransactionData.splitType,
      };

      const { data, error: updateError } = await supabase // Renamed 'error'
        .from("transactions")
        .update(transactionToUpdate)
        .eq("id", updatedTransactionData.id) // Specify which row to update
        .select();

      if (updateError) throw updateError;

      if (data && data.length > 0) {
        setTransactions(
          (prev) =>
            prev
              .map((t) => (t.id === data[0].id ? data[0] : t))
              .sort((a, b) => new Date(b.date) - new Date(a.date)) // Keep sorted
        );
      }
      setEditingTransaction(null);
    } catch (error) {
      console.error("Error updating transaction:", error);
      alert(`Error updating transaction: ${error.message}`);
    }
  }, []);

  const deleteTransaction = useCallback(async (transactionId) => {
    try {
      const { error: deleteError } = await supabase // Renamed 'error'
        .from("transactions")
        .delete()
        .eq("id", transactionId);

      if (deleteError) throw deleteError;

      setTransactions((prev) => prev.filter((t) => t.id !== transactionId));
    } catch (error) {
      console.error("Error deleting transaction:", error);
      alert(`Error deleting transaction: ${error.message}`);
    }
  }, []);

  // --- Settings CRUD (User Names & Categories) ---
  const updateUserNames = useCallback(async (newUser1Name, newUser2Name) => {
    try {
      // const updates = [ // This variable was unused and correctly removed
      //   { key: 'user1_name', value: newUser1Name },
      //   { key: 'user2_name', value: newUser2Name },
      // ];

      const { error: err1 } = await supabase
        .from("app_settings")
        .update({ value: newUser1Name })
        .eq("key", "user1_name");
      if (err1) throw err1;
      const { error: err2 } = await supabase
        .from("app_settings")
        .update({ value: newUser2Name })
        .eq("key", "user2_name");
      if (err2) throw err2;

      setUserNames([newUser1Name, newUser2Name]); // Update local state on success
    } catch (error) {
      console.error("Error updating user names:", error);
      alert(`Error updating user names: ${error.message}`);
    }
  }, []);

  const addCategory = useCallback(
    async (newCategoryName) => {
      if (!newCategoryName || categories.includes(newCategoryName)) {
        if (categories.includes(newCategoryName))
          alert("Category already exists.");
        return;
      }
      try {
        const { data, error: insertCatError } = await supabase // Renamed 'error'
          .from("categories")
          .insert([{ name: newCategoryName }])
          .select();

        if (insertCatError) throw insertCatError;

        if (data && data.length > 0) {
          // Add to local state and keep sorted
          setCategories((prev) => [...prev, data[0].name].sort());
        }
      } catch (error) {
        console.error("Error adding category:", error);
        alert(`Error adding category: ${error.message}`);
      }
    },
    [categories]
  ); // categories is a dependency

  const deleteCategory = useCallback(async (categoryNameToDelete) => {
    try {
      const { error: deleteCatError } = await supabase // Renamed 'error'
        .from("categories")
        .delete()
        .eq("name", categoryNameToDelete);

      if (deleteCatError) throw deleteCatError;

      setCategories((prev) =>
        prev.filter((cat) => cat !== categoryNameToDelete)
      );
    } catch (error) {
      console.error("Error deleting category:", error);
      alert(`Error deleting category: ${error.message}`);
    }
  }, []);

  const handleSetEditingTransaction = useCallback((transaction) => {
    setEditingTransaction(transaction);
  }, []);

  // --- UI ---
  if (loading) {
    return <div>Loading application data...</div>;
  }
  if (error) {
    return (
      <div style={{ color: "red" }}>
        Error: {error}{" "}
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  // Define contextValue before it's used in the return statement
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
