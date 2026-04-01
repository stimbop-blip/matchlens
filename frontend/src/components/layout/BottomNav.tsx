import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CreditCard, Home, Shield, Signal, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { useHaptics } from "../../hooks/useHaptics";
import { api } from "../../lib/api";
import { useI18n } from "../../lib/i18n";

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const h = useHaptics();
  const { t } = useI18n();

  const profileQuery = useQuery({
    queryKey: ["profile", "nav-role"],
    queryFn: api.getProfile,
    staleTime: 60_000,
  });

  const isAdmin = profileQuery.data?.role === "admin";

  const items = [
    { to: "/", label: t("nav.home"), icon: Home },
    { to: "/signals", label: t("nav.signals"), icon: Signal },
    { to: "/tariffs", label: t("nav.tariffs"), icon: CreditCard },
    { to: "/profile", label: t("nav.profile"), icon: User },
    ...(isAdmin ? [{ to: "/admin", label: t("nav.admin"), icon: Shield }] : []),
  ];

  return (
    <nav className="fixed bottom-3 left-1/2 z-50 w-[calc(100%-16px)] max-w-md -translate-x-1/2 rounded-2xl border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_88%,transparent)] p-2 backdrop-blur-xl">
      <div className={`grid gap-2 ${isAdmin ? "grid-cols-5" : "grid-cols-4"}`}>
        {items.map((item) => {
          const active = location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to));
          const Icon = item.icon;
          return (
            <button
              key={item.to}
              type="button"
              onClick={() => {
                h.tap();
                navigate(item.to);
              }}
              className="relative flex min-h-[56px] flex-col items-center justify-center rounded-xl border border-transparent text-[11px]"
            >
              {active ? (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-xl border border-[color:color-mix(in_srgb,var(--accent)_50%,transparent)]"
                  transition={{ type: "spring", stiffness: 360, damping: 28 }}
                />
              ) : null}
              <Icon size={17} className={active ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"} />
              <span className={active ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
