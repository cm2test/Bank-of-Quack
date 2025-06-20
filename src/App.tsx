// src/App.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Outlet,
  Link,
  useLocation,
  Location,
  useNavigate,
} from "react-router-dom";
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
  const [
    sectorCategoryEmptyStateImageUrl,
    setSectorCategoryEmptyStateImageUrl,
  ] = useState<string | null>(null);
  const handleSetEditingTransaction = (t: any) => setEditingTransaction(t);
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);

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

  const deleteTransaction = useCallback(async (id: string) => {
    if (!id) return;
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateCategory = useCallback(async (id: string, name: string) => {
    if (!id || !name) return;
    const { data, error } = await supabase
      .from("categories")
      .update({ name })
      .eq("id", id)
      .select();
    if (error) return alert(error.message);
    if (data && data.length > 0) {
      setCategories((prev) =>
        prev.map((cat) => (cat.id === id ? { ...cat, ...data[0] } : cat))
      );
    }
  }, []);

  const updateSector = useCallback(async (id: string, name: string) => {
    if (!id || !name) return;
    const { data, error } = await supabase
      .from("sectors")
      .update({ name })
      .eq("id", id)
      .select();
    if (error) return alert(error.message);
    if (data && data.length > 0) {
      setSectors((prev) =>
        prev.map((sec) => (sec.id === id ? { ...sec, ...data[0] } : sec))
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
          const emptyStateImg = appSettings.find(
            (s: any) => s.key === "sector_category_empty_state_image_url"
          );
          if (u1) fetchedUser1Name = u1.value;
          if (u2) fetchedUser2Name = u2.value;
          if (u1Avatar) fetchedUser1AvatarUrl = u1Avatar.value;
          if (u2Avatar) fetchedUser2AvatarUrl = u2Avatar.value;
          if (emptyStateImg)
            setSectorCategoryEmptyStateImageUrl(emptyStateImg.value);
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

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login", { replace: true });
      }
      setAuthChecked(true);
    };
    checkAuth();
  }, [navigate]);

  const location = useLocation();

  if (!authChecked) {
    return (
      <div className="flex-1 flex items-center justify-center">
        Checking authentication...
      </div>
    );
  }

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
      {/* Removed desktop nav bar for desktop (md and up) */}
      {/* Hero section with BankerQuack image */}
      <div
        className="w-full flex items-center justify-center bg-[#004D40] relative"
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
        {/* Animated Cursive Text Overlay */}
        <span
          className="absolute left-1/2 top-2/3 -translate-x-1/2 -translate-y-1/2 text-5xl sm:text-8xl font-bold pointer-events-none select-none animate-typewriter whitespace-nowrap"
          style={{
            color: "#FFD700",
            fontWeight: 700,
            fontFamily: "cursive",
            WebkitTextFillColor: "#FFD700",
            textShadow: "0 2px 8px #000, 0 0px 2px #000",
            zIndex: 10,
          }}
        >
          <TypewriterText text="Bank of Quack" speed={120} pause={1000} />
        </span>
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
              // Transactions
              transactions,
              setTransactions,
              addTransaction,
              updateTransaction,
              deleteTransaction,
              editingTransaction,
              handleSetEditingTransaction,

              // Users
              userNames,
              updateUserNames,
              user1AvatarUrl,
              user2AvatarUrl,

              // Categories
              categories,
              addCategory,
              deleteCategory,
              updateCategory,

              // Sectors
              sectors,
              addSector,
              deleteSector,
              addCategoryToSector,
              removeCategoryFromSector,
              updateSector,

              // Misc
              sectorCategoryEmptyStateImageUrl,
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

function TypewriterText({
  text,
  speed = 120,
  pause = 1000,
}: {
  text: string;
  speed?: number;
  pause?: number;
}) {
  const [displayed, setDisplayed] = React.useState("");
  const [index, setIndex] = React.useState(0);
  React.useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (index < text.length) {
      timeout = setTimeout(() => {
        setDisplayed((prev) => prev + text[index]);
        setIndex((i) => i + 1);
      }, speed);
    } else {
      timeout = setTimeout(() => {
        setDisplayed("");
        setIndex(0);
      }, pause);
    }
    return () => clearTimeout(timeout);
  }, [index, text, speed, pause]);

  // Render with special font for 'Q' in 'Bank of Quack'
  const qIndex = text.indexOf("Q");
  if (qIndex === -1) return <>{displayed}</>;
  // Split displayed into before Q, Q, after Q
  const beforeQ = displayed.slice(0, qIndex);
  const qChar = displayed[qIndex] || "";
  const afterQ = displayed.slice(qIndex + 1);
  return (
    <>
      {beforeQ}
      {qChar && (
        <span
          style={{
            fontFamily: "Dancing Script, cursive",
            display: "inline-block",
          }}
        >
          {qChar}
        </span>
      )}
      {afterQ}
    </>
  );
}

export default App;
