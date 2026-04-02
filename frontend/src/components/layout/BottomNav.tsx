import { Home, User, Zap } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { useHaptics } from "../../hooks/useHaptics";

const navItems = [
  { to: "/", label: "Обзор", icon: Home },
  { to: "/feed", label: "Сигналы", icon: Zap },
  { to: "/profile", label: "Аккаунт", icon: User },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const h = useHaptics();

  return (
    <nav className="pb-telegram-dock">
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
