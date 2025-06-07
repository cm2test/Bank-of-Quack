import React, { useState, useEffect, useRef } from "react";
import { Home, Plus, Settings as SettingsIcon, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/supabaseClient";

const NAV_LINKS = [
  {
    label: "Dashboard",
    icon: <Home className="w-6 h-6 text-green-500" />,
    to: "/",
  },
  {
    label: "New Transaction",
    icon: <Plus className="w-6 h-6 text-green-500" />,
    to: "/transactions",
  },
  {
    label: "Settings",
    icon: <SettingsIcon className="w-6 h-6 text-green-500" />,
    to: "/settings",
  },
];

const DuckFabNav: React.FC = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setLoggedIn(!!session);
    };
    checkSession();
  }, []);

  const handleNav = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 sm:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      {/* FAB and Actions */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 sm:hidden">
        {/* Action Buttons */}
        <div
          className={`flex flex-col items-end gap-4 transition-all duration-300 ${
            open
              ? "opacity-100 translate-y-0"
              : "opacity-0 pointer-events-none translate-y-4"
          }`}
        >
          {NAV_LINKS.map((link, i) => (
            <button
              key={link.to}
              onClick={() => handleNav(link.to)}
              className="flex items-center group"
              style={{ transitionDelay: `${open ? i * 60 : 0}ms` }}
            >
              <span className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center transition-transform group-active:scale-95">
                {link.icon}
              </span>
            </button>
          ))}
        </div>
        {/* FAB and Logout Row */}
        <div className="flex flex-row items-center gap-4">
          {loggedIn && open && (
            <Button
              onClick={handleLogout}
              className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg bg-white"
              aria-label="Logout"
            >
              <LogOut className="w-6 h-6 text-green-500" />
            </Button>
          )}
          {/* Duck FAB */}
          <button
            onClick={() => setOpen((v) => !v)}
            className={`w-16 h-16 rounded-full bg-yellow-300 shadow-2xl flex items-center justify-center text-4xl border-4 border-white transition-transform active:scale-95 ${
              open ? "rotate-12" : ""
            }`}
            aria-label="Open navigation menu"
            style={{
              fontFamily:
                "Apple Color Emoji,Segoe UI Emoji,NotoColorEmoji,Android Emoji,EmojiSymbols,sans-serif",
            }}
          >
            🦆
          </button>
        </div>
      </div>
    </>
  );
};

export default DuckFabNav;
