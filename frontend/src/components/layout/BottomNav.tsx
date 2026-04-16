import { Home, User, Zap } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

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
    <nav className="pb-telegram-dock" aria-label={t("layout.nav.aria")}>
      <div className="pb-telegram-dock-row">
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
              className={isActive ? "pb-telegram-dock-item active" : "pb-telegram-dock-item"}
            >
              <item.icon size={isActive ? 23 : 21} strokeWidth={2.2} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
