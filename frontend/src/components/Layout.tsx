import { type PropsWithChildren, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { useLanguage } from "../app/language";
import { api } from "../services/api";
import { waitForTelegramInitData } from "../services/telegram";

export function Layout({ children }: PropsWithChildren) {
  const { language } = useLanguage();
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

  const isRu = language === "ru";
  const tabs = [
    {
      to: "/",
      label: isRu ? "Главная" : "Home",
      icon: "⌂",
      active: location.pathname === "/",
    },
    {
      to: "/feed",
      label: isRu ? "Лента" : "Feed",
      icon: "◉",
      active: location.pathname.startsWith("/feed"),
    },
    {
      to: "/stats",
      label: isRu ? "Статистика" : "Stats",
      icon: "◔",
      active: location.pathname.startsWith("/stats"),
    },
    {
      to: "/profile",
      label: isRu ? "Профиль" : "Profile",
      icon: "◎",
      active: location.pathname.startsWith("/profile"),
    },
    {
      to: "/menu",
      label: isRu ? "Меню" : "Menu",
      icon: "☰",
      active:
        location.pathname.startsWith("/menu") ||
        location.pathname.startsWith("/tariffs") ||
        location.pathname.startsWith("/news") ||
        (isAdmin && location.pathname.startsWith("/admin")),
    },
  ];

  const pageTitle = (() => {
    if (location.pathname.startsWith("/feed")) return isRu ? "Лента" : "Feed";
    if (location.pathname.startsWith("/stats")) return isRu ? "Статистика" : "Stats";
    if (location.pathname.startsWith("/profile")) return isRu ? "Профиль" : "Profile";
    if (location.pathname.startsWith("/menu")) return isRu ? "Меню" : "Menu";
    if (location.pathname.startsWith("/tariffs")) return isRu ? "Тарифы" : "Tariffs";
    if (location.pathname.startsWith("/news")) return isRu ? "Новости" : "News";
    if (location.pathname.startsWith("/admin")) return isRu ? "Админка" : "Admin";
    return isRu ? "Главная" : "Home";
  })();

  const subtitle = isRu
    ? "PIT BET — сигналы, статистика и доступ к сильным игровым ситуациям"
    : "PIT BET — signals, stats, and access to strong market spots";

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-chip">PIT BET</div>
        <h1>{pageTitle}</h1>
        <p>{subtitle}</p>
      </header>

      <main className="content">{children}</main>

      <nav className="tabbar">
        {tabs.map((item) => (
          <Link key={item.to} to={item.to} className={item.active ? "active" : ""}>
            <span className="tab-icon">{item.icon}</span>
            <span className="tab-label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
