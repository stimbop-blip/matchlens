import { Home, User, Zap } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { useI18n } from "../../app/i18n";
import { useHaptics } from "../../hooks/useHaptics";

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  const h = useHaptics();

  const navItems = [
    { to: "/", label: t("layout.nav.home"), icon: Home },
    { to: "/feed", label: t("layout.nav.feed"), icon: Zap },
    { to: "/profile", label: t("layout.nav.profile"), icon: User },
  ];

  return (
    <nav className="pb-nav-pill-v3" aria-label={t("layout.nav.aria")}>
      <div className="pb-nav-pill-row-v3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to));

          return (
            <button
              key={item.to}
              type="button"
              onClick={() => {
                h.tap();
                navigate(item.to);
              }}
              className={isActive ? "pb-nav-pill-btn-v3 active" : "pb-nav-pill-btn-v3"}
            >
              {isActive ? (
                <motion.div
                  layoutId="pb-nav-pill-active-v3"
                  className="pb-nav-pill-active-inner-v3"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                >
                  <item.icon size={19} strokeWidth={2.4} />
                  <AnimatePresence>
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="pb-nav-pill-label-v3"
                    >
                      {item.label}
                    </motion.span>
                  </AnimatePresence>
                </motion.div>
              ) : (
                <div className="pb-nav-pill-inactive-inner-v3">
                  <item.icon size={21} strokeWidth={2} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
