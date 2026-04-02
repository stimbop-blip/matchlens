import { useLocation, useNavigate } from "react-router-dom";
import { Home, Zap, BarChart3, User, Settings } from "lucide-react";
import { useHaptics } from "../../hooks/useHaptics";

const navItems = [
  { to: "/", label: "Обзор", icon: Home },
  { to: "/signals", label: "Сигналы", icon: Zap },
  { to: "/tariffs", label: "Тарифы", icon: BarChart3 },
  { to: "/profile", label: "Аккаунт", icon: User },
  { to: "/admin", label: "Центр", icon: Settings },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const h = useHaptics();

  return (
    <nav className="fixed bottom-4 left-1/2 z-50 w-[92%] max-w-[420px] -translate-x-1/2 rounded-3xl border border-white/10 bg-black/70 backdrop-blur-2xl shadow-2xl">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to ||
                          (item.to !== "/" && location.pathname.startsWith(item.to));

          return (
            <button
              key={item.to}
              onClick={() => {
                h.tap();
                navigate(item.to);
              }}
              className={`flex flex-col items-center justify-center py-2 px-4 rounded-3xl transition-all duration-200 ${
                isActive
                  ? "text-[#00ff9d] scale-110"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <item.icon size={24} strokeWidth={2.2} />
              <span className="text-[10px] mt-1 font-medium tracking-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
