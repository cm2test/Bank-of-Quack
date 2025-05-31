// src/App.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Outlet, Link, useLocation, Location } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "./supabaseClient";
import { Menu } from "lucide-react";
import ReactDOM from "react-dom";
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
  const [user1AvatarUrl, setUser1AvatarUrl] = useState<string | null>(null);
  const [user2AvatarUrl, setUser2AvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<any | null>(
    null
  );
  const [bgHeight, setBgHeight] = useState<number | null>(null);
  const handleSetEditingTransaction = (t: any) => setEditingTransaction(t);

  const addCategory = useCallback(async (name: string) => {
    if (!name) return;
    const { data, error } = await supabase
      .from("categories")
      .insert([{ name }])
      .select();
    if (error) return alert(error.message);
    if (data && data.length > 0) setCategories((prev) => [...prev, data[0]]);
  }, []);

  const deleteCategory = useCallback(async (cat: any) => {
    if (!cat?.id) return;
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", cat.id);
    if (error) return alert(error.message);
    setCategories((prev) => prev.filter((c) => c.id !== cat.id));
  }, []);

  const addSector = useCallback(async (name: string) => {
    if (!name) return null;
    const { data, error } = await supabase
      .from("sectors")
      .insert([{ name }])
      .select();
    if (error) {
      alert(error.message);
      return null;
    }
    if (data && data.length > 0) {
      const newSector = { ...data[0], category_ids: [] };
      setSectors((prev) => [...prev, newSector]);
      return newSector;
    }
    return null;
  }, []);

  const deleteSector = useCallback(async (id: string) => {
    if (!id) return;
    const { error } = await supabase.from("sectors").delete().eq("id", id);
    if (error) return alert(error.message);
    setSectors((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const addCategoryToSector = useCallback(
    async (sectorId: string, categoryId: string) => {
      if (!sectorId || !categoryId) return;
      const { error } = await supabase
        .from("sector_categories")
        .insert([{ sector_id: sectorId, category_id: categoryId }]);
      if (error) return alert(error.message);
      setSectors((prev) =>
        prev.map((s) =>
          s.id === sectorId
            ? { ...s, category_ids: [...(s.category_ids || []), categoryId] }
            : s
        )
      );
    },
    []
  );

  const removeCategoryFromSector = useCallback(
    async (sectorId: string, categoryId: string) => {
      if (!sectorId || !categoryId) return;
      const { error } = await supabase
        .from("sector_categories")
        .delete()
        .match({ sector_id: sectorId, category_id: categoryId });
      if (error) return alert(error.message);
      setSectors((prev) =>
        prev.map((s) =>
          s.id === sectorId
            ? {
                ...s,
                category_ids: (s.category_ids || []).filter(
                  (id: string) => id !== categoryId
                ),
              }
            : s
        )
      );
    },
    []
  );

  const updateUserNames = useCallback(async (n1: string, n2: string) => {
    await supabase
      .from("app_settings")
      .update({ value: n1 })
      .eq("key", "user1_name");
    await supabase
      .from("app_settings")
      .update({ value: n2 })
      .eq("key", "user2_name");
    setUserNames([n1, n2]);
  }, []);

  const addTransaction = useCallback(async (t: Partial<Transaction>) => {
    if (!t) return;
    const { data, error } = await supabase
      .from("transactions")
      .insert([t])
      .select();
    if (error) {
      alert(error.message);
      return;
    }
    if (data && data.length > 0) setTransactions((prev) => [data[0], ...prev]);
  }, []);

  const updateTransaction = useCallback(async (t: Partial<Transaction>) => {
    if (!t || !t.id) return;
    const { data, error } = await supabase
      .from("transactions")
      .update(t)
      .eq("id", t.id)
      .select();
    if (error) {
      alert(error.message);
      return;
    }
    if (data && data.length > 0) {
      setTransactions((prev) =>
        prev.map((tr) => (tr.id === t.id ? { ...tr, ...data[0] } : tr))
      );
    }
  }, []);

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        // Fetch user names and avatar URLs
        let { data: appSettings, error: settingsError } = await supabase
          .from("app_settings")
          .select("key, value");
        if (settingsError) throw settingsError;
        let fetchedUser1Name = "User 1",
          fetchedUser2Name = "User 2";
        let fetchedUser1AvatarUrl = null,
          fetchedUser2AvatarUrl = null;
        if (appSettings) {
          const u1 = appSettings.find((s: any) => s.key === "user1_name");
          const u2 = appSettings.find((s: any) => s.key === "user2_name");
          const u1Avatar = appSettings.find(
            (s: any) => s.key === "user1_avatar_url"
          );
          const u2Avatar = appSettings.find(
            (s: any) => s.key === "user2_avatar_url"
          );
          if (u1) fetchedUser1Name = u1.value;
          if (u2) fetchedUser2Name = u2.value;
          if (u1Avatar) fetchedUser1AvatarUrl = u1Avatar.value;
          if (u2Avatar) fetchedUser2AvatarUrl = u2Avatar.value;
        }
        setUserNames([fetchedUser1Name, fetchedUser2Name]);
        setUser1AvatarUrl(fetchedUser1AvatarUrl);
        setUser2AvatarUrl(fetchedUser2AvatarUrl);

        // Fetch categories
        let { data: fetchedCategories, error: categoriesError } = await supabase
          .from("categories")
          .select("id, name, image_url")
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

  useEffect(() => {
    const img = new window.Image();
    img.src = "/BankerQuack.png";
    img.onload = function () {
      const aspectRatio = img.width / img.height;
      const width = window.innerWidth;
      const height = width / aspectRatio;
      setBgHeight(height);
    };
    // Recalculate on resize
    const handleResize = () => {
      if (img.width && img.height) {
        const aspectRatio = img.width / img.height;
        const width = window.innerWidth;
        const height = width / aspectRatio;
        setBgHeight(height);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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
      <nav
        className="flex items-center justify-between py-6 border-b z-10 relative px-8"
        style={{
          background: "#004D40",
        }}
      >
        <span className="text-3xl font-extrabold text-white select-none">
          Bank of Quack
        </span>
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Button
              key={link.to}
              asChild
              variant={location.pathname === link.to ? "secondary" : "ghost"}
              className={`text-lg font-semibold ${
                location.pathname === link.to
                  ? "bg-white text-[#004D40]"
                  : "text-white hover:bg-white/10"
              } transition-colors`}
              style={{ cursor: "pointer" }}
            >
              <Link to={link.to}>{link.label}</Link>
            </Button>
          ))}
        </div>
        <div className="md:hidden flex items-center">
          <MobileMenu navLinks={navLinks} location={location} />
        </div>
      </nav>
      {/* Hero section with BankerQuack image */}
      <div
        className="w-full flex items-center justify-center bg-[#004D40]"
        style={{
          width: "100vw",
          overflow: "hidden",
          background: "#004D40",
        }}
      >
        <img
          src="/BankerQuack.png"
          alt="Banker Quack"
          style={{
            width: "100vw",
            height: "auto",
            display: "block",
            objectFit: "contain",
          }}
        />
      </div>
      {/* Main content below the hero image */}
      <main
        className="flex-1 flex flex-col items-center justify-center p-8 w-full relative"
        style={{
          background: "linear-gradient(to bottom, #004D40 0%, #26A69A 100%)",
        }}
      >
        <div className="relative z-10 w-full flex flex-col items-center">
          <Outlet
            context={{
              transactions,
              userNames,
              categories,
              setCategories,
              sectors,
              addCategory,
              deleteCategory,
              addSector,
              deleteSector,
              addCategoryToSector,
              removeCategoryFromSector,
              updateUserNames,
              handleSetEditingTransaction,
              editingTransaction,
              addTransaction,
              updateTransaction,
              user1AvatarUrl,
              user2AvatarUrl,
            }}
          />
        </div>
      </main>
    </div>
  );
};

function MobileMenu({
  navLinks,
  location,
}: {
  navLinks: { to: string; label: string }[];
  location: Location;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="p-2 rounded-md hover:bg-[#004D40]/20 focus:outline-none focus:ring-2 focus:ring-[#004D40]"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open navigation menu"
      >
        <Menu className="w-7 h-7 text-white" />
      </button>
      {open &&
        ReactDOM.createPortal(
          <>
            <div
              className="fixed inset-0 z-[9998] bg-black/20"
              onClick={() => setOpen(false)}
            />
            <div className="fixed right-4 top-20 bg-[#004D40] border border-[#004D40] rounded-lg shadow-2xl z-[9999] min-w-[180px] flex flex-col">
              {navLinks.map((link: { to: string; label: string }) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-6 py-3 text-lg font-semibold text-white hover:bg-white/10 transition-colors ${
                    location.pathname === link.to ? "font-bold bg-white/10" : ""
                  }`}
                  style={{ cursor: "pointer" }}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </>,
          document.body
        )}
    </>
  );
}

export default App;
