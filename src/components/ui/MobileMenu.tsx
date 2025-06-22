import React from "react";
import { Link, Location } from "react-router-dom";
import ReactDOM from "react-dom";
import { Button } from "@/components/ui/button";

interface MobileMenuProps {
  navLinks: { to: string; label: string }[];
  location: Location;
  onClose: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  navLinks,
  location,
  onClose,
}) => {
  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-lg p-8 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {navLinks.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            onClick={onClose}
            className={`block text-center text-xl py-2 ${
              location.pathname === to
                ? "font-bold text-primary"
                : "text-foreground"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>,
    document.body
  );
};

export default MobileMenu;
