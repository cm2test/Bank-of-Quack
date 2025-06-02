import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, Plus, Settings as SettingsIcon } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const NAV_LINKS = [
  {
    label: "Dashboard",
    icon: <Home className="w-5 h-5" />,
    to: "/",
  },
  {
    label: "New Transaction",
    icon: <Plus className="w-5 h-5" />,
    to: "/transactions",
  },
  {
    label: "Settings",
    icon: <SettingsIcon className="w-5 h-5" />,
    to: "/settings",
  },
];

const BottomNavBar: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setVisible(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setVisible(false);
      }, 2000);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Show on mount for 2s (in case user doesn't scroll)
  useEffect(() => {
    setVisible(true);
    timeoutRef.current = setTimeout(() => setVisible(false), 2000);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <nav
      className={`fixed bottom-0 left-0 w-full z-50 sm:hidden transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="flex justify-around bg-background border-t border-border shadow-lg py-2">
        {NAV_LINKS.map((link) => (
          <Button
            key={link.to}
            variant="ghost"
            className="flex flex-col items-center px-3 py-1"
            onClick={() => navigate(link.to)}
            aria-label={link.label}
          >
            {link.icon}
            <span className="text-xs mt-0.5">{link.label}</span>
          </Button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavBar;
