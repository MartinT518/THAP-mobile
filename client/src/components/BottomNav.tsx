import { Home, Search, Menu as MenuIcon, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  path: string;
  isActive: boolean;
  onClick: () => void;
}

function NavItem({ icon: Icon, label, isActive, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center justify-center gap-1 min-w-[64px] tap-target"
      aria-current={isActive ? "page" : undefined}
    >
      <motion.div
        animate={{ scale: isActive ? 1 : 0.9, y: isActive ? -2 : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <Icon
          className={`w-6 h-6 transition-colors duration-200 ${
            isActive ? "text-primary" : "text-muted-foreground"
          }`}
        />
      </motion.div>
      <span
        className={`text-xs transition-colors duration-200 ${
          isActive ? "text-primary font-medium" : "text-muted-foreground"
        }`}
      >
        {label}
      </span>
      {isActive && (
        <motion.div
          layoutId="nav-indicator"
          className="absolute -bottom-1 w-5 h-0.5 bg-primary rounded-full"
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        />
      )}
    </button>
  );
}

export function BottomNav() {
  const { t } = useTranslation();
  const [location, navigate] = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50 safe-bottom">
      <nav
        className="relative flex items-center justify-center h-20 max-w-screen-xl mx-auto"
        role="navigation"
        aria-label={t("nav.main", "Main navigation")}
      >
        <div className="flex-1 flex justify-around items-center">
          <NavItem
            icon={Home}
            label={t("nav.myThings")}
            path="/"
            isActive={location === "/"}
            onClick={() => navigate("/")}
          />
          <NavItem
            icon={Search}
            label={t("nav.search")}
            path="/search"
            isActive={location === "/search"}
            onClick={() => navigate("/search")}
          />
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 -top-3">
          <motion.button
            onClick={() => navigate("/scan")}
            className="flex items-center justify-center"
            whileTap={{ scale: 0.92 }}
            aria-label={t("nav.scan", "Scan product")}
          >
            <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center shadow-lg">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </div>
          </motion.button>
        </div>

        <div className="flex-1 flex justify-around items-center">
          <NavItem
            icon={MessageSquare}
            label={t("nav.feed")}
            path="/feed"
            isActive={location === "/feed"}
            onClick={() => navigate("/feed")}
          />
          <NavItem
            icon={MenuIcon}
            label={t("nav.menu")}
            path="/menu"
            isActive={location === "/menu"}
            onClick={() => navigate("/menu")}
          />
        </div>
      </nav>
    </div>
  );
}
