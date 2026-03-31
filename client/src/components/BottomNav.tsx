import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";

interface NavItemProps {
  iconSrc: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function NavItem({ iconSrc, label, isActive, onClick }: NavItemProps) {
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
        <img
          src={iconSrc}
          alt=""
          width={26}
          height={26}
          className={`transition-opacity duration-200 ${
            isActive ? "opacity-100" : "opacity-40"
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
            iconSrc="/assets/icons/general_home.svg"
            label={t("nav.myThings")}
            isActive={location === "/"}
            onClick={() => navigate("/")}
          />
          <NavItem
            iconSrc="/assets/icons/general_search-search.svg"
            label={t("nav.search")}
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
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="white"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M4 4H10V10H4V4ZM20 4V10H14V4H20ZM14 15H16V13H14V11H16V13H18V11H20V13H18V15H20V18H18V20H16V18H13V20H11V16H14V15ZM16 15V18H18V15H16ZM4 20V14H10V20H4ZM6 6V8H8V6H6ZM16 6V8H18V6H16ZM6 16V18H8V16H6ZM4 11H6V13H4V11ZM9 11H13V15H11V13H9V11ZM11 6H13V10H11V6ZM2 2V6H0V2C0 1.46957 0.210714 0.960859 0.585786 0.585786C0.960859 0.210714 1.46957 0 2 0L6 0V2H2ZM22 0C22.5304 0 23.0391 0.210714 23.4142 0.585786C23.7893 0.960859 24 1.46957 24 2V6H22V2H18V0H22ZM2 18V22H6V24H2C1.46957 24 0.960859 23.7893 0.585786 23.4142C0.210714 23.0391 0 22.5304 0 22V18H2ZM22 22V18H24V22C24 22.5304 23.7893 23.0391 23.4142 23.4142C23.0391 23.7893 22.5304 24 22 24H18V22H22Z" />
              </svg>
            </div>
          </motion.button>
        </div>

        <div className="flex-1 flex justify-around items-center">
          <NavItem
            iconSrc="/assets/icons/general_messages-multiple.svg"
            label={t("nav.feed")}
            isActive={location === "/feed"}
            onClick={() => navigate("/feed")}
          />
          <NavItem
            iconSrc="/assets/icons/general_menu-burger.svg"
            label={t("nav.menu")}
            isActive={location === "/menu"}
            onClick={() => navigate("/menu")}
          />
        </div>
      </nav>
    </div>
  );
}
