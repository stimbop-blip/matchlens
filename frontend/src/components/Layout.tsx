import { type PropsWithChildren, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { api } from "../services/api";
import { waitForTelegramInitData } from "../services/telegram";

export function Layout({ children }: PropsWithChildren) {
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let alive = true;
    const loadMe = async () => {
      const initData = await waitForTelegramInitData();
      if (!alive || !initData) return;
      api
        .me()
        .then((me) => {
          if (!alive) return;
          setIsAdmin(Boolean(me.is_admin || me.role === "admin"));
        })
        .catch(() => {
          if (!alive) return;
          setIsAdmin(false);
        });
    };
    void loadMe();
    return () => {
      alive = false;
    };
  }, []);

  const links = [
    { to: "/", label: "Главная" },
    { to: "/feed", label: "Лента" },
    { to: "/stats", label: "Статистика" },
    { to: "/tariffs", label: "Тарифы" },
    { to: "/profile", label: "Профиль" },
    ...(isAdmin ? [{ to: "/admin", label: "Админка" }] : []),
  ];

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-chip">MatchLens Elite</div>
        <h1>Спортивная аналитика без шума</h1>
        <p>Премиальный dark-интерфейс, четкие сигналы и прозрачная статистика</p>
      </header>

      <main className="content">{children}</main>

      <nav className={`tabbar ${isAdmin ? "tabbar-admin" : ""}`}>
        {links.map((item) => (
          <Link key={item.to} to={item.to} className={location.pathname === item.to ? "active" : ""}>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
