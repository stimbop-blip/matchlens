import { BarChart3, Home, Settings, User, Zap } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { useHaptics } from "../../hooks/useHaptics";

const navItems = [
  { to: "/", label: "Обзор", icon: Home },
  { to: "/feed", label: "Сигналы", icon: Zap },
  { to: "/tariffs", label: "Тарифы", icon: BarChart3 },
  { to: "/profile", label: "Аккаунт", icon: User },
  { to: "/menu", label: "Центр", icon: Settings },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const h = useHaptics();

  return (
    <nav className="fixed bottom-4 left-1/2 z-50 w-[88%] max-w-[440px] -translate-x-1/2 rounded-[9999px] border border-white/10 bg-[#111927]/70 backdrop-blur-2xl shadow-[0_12px_32px_rgba(0,0,0,0.28)]">
      <div className="flex items-center justify-between px-2 py-1.5">
        {navItems.map((item, index) => {
          const isCenter = index === 4;
          const isActive = location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to));

          return (
            <button
              key={item.to}
              type="button"
              onClick={() => {
                h.tap();
                navigate(item.to);
              }}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center rounded-[9999px] px-2 py-1.5 transition-all duration-200 ${
                isActive ? "text-[#229ed9]" : "text-[#8a9ba8] hover:text-white"
              }`}
            >
              <item.icon size={isCenter ? 23 : 21} strokeWidth={2.2} />
              <span className="mt-1 text-[10px] font-medium leading-none tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
