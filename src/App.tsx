// src/App.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "./supabaseClient";
// Import types if needed
// import { Transaction, Category, Sector } from "./types";

const navLinks = [
  { to: "/", label: "Dashboard" },
  { to: "/transactions", label: "Transactions" },
  { to: "/settings", label: "Settings" },
];

// Minimal type definitions (replace with your real types if available)
type Transaction = any;
type Category = any;
type Sector = any;

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userNames, setUserNames] = useState<string[]>(["User 1", "User 2"]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        // Fetch user names
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

        // Fetch categories
        let { data: fetchedCategories, error: categoriesError } = await supabase
          .from("categories")
          .select("id, name")
          .order("name", { ascending: true });
        if (categoriesError) throw categoriesError;
        setCategories(fetchedCategories || []);

        // Fetch sectors and sector-category links
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

        // Fetch transactions
        let { data: fetchedTransactions, error: transactionsError } =
          await supabase
            .from("transactions")
            .select("*")
            .order("date", { ascending: false });
        if (transactionsError) throw transactionsError;
        setTransactions(fetchedTransactions || []);
      } catch (err) {
        const error = err as Error;
        setError(error.message || "Failed to fetch data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const location = useLocation();
  if (loading)
    return (
      <div className="flex-1 flex items-center justify-center">Loading...</div>
    );
  if (error)
    return (
      <div className="flex-1 flex items-center justify-center text-red-500">
        {error}
      </div>
    );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <nav className="flex items-center justify-center gap-4 py-6 border-b">
        {navLinks.map((link) => (
          <Button
            key={link.to}
            asChild
            variant={location.pathname === link.to ? "default" : "outline"}
          >
            <Link to={link.to}>{link.label}</Link>
          </Button>
        ))}
      </nav>
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <Outlet context={{ transactions, userNames, categories, sectors }} />
      </main>
    </div>
  );
};

export default App;
