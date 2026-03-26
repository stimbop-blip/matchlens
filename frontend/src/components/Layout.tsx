import { type PropsWithChildren, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import { useLanguage } from "../app/language";
import { api } from "../services/api";
import { waitForTelegramInitData } from "../services/telegram";
import { BottomNavItem } from "./ui";

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 11.8 12 5l8 6.8V20a1 1 0 0 1-1 1h-5v-5h-4v5H5a1 1 0 0 1-1-1z" />
    </svg>
  );
}

function FeedIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3H4zm0 5h16v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm3 2v2h4v-2zm6 0v2h4v-2z" />
    </svg>
  );
}

function StatsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 19h16v2H4zM6 10h3v8H6zm5-4h3v12h-3zm5 6h3v6h-3z" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4a4.2 4.2 0 1 1 0 8.4A4.2 4.2 0 0 1 12 4m0 10.4c4.8 0 8 2.4 8 5.2V21H4v-1.4c0-2.8 3.2-5.2 8-5.2" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
    </svg>
  );
}

export function Layout({ children }: PropsWithChildren) {
  const { language } = useLanguage();
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();
  const isRu = language === "ru";

  useEffect(() => {
    let alive = true;
    const loadMe = async () => {
      const initData = await waitForTelegramInitData();
      if (!alive || !initData) return;
      try {
        const me = await api.me();
        if (!alive) return;
        setIsAdmin(Boolean(me.is_admin || me.role === "admin"));
      } catch {
        if (!alive) return;
        setIsAdmin(false);
      }
    };
    void loadMe();
    return () => {
      alive = false;
    };
  }, []);

  const pageTitle = useMemo(() => {
    if (location.pathname.startsWith("/feed")) return isRu ? "Лента" : "Feed";
    if (location.pathname.startsWith("/stats")) return isRu ? "Статистика" : "Stats";
    if (location.pathname.startsWith("/profile")) return isRu ? "Профиль" : "Profile";
    if (location.pathname.startsWith("/menu/language")) return isRu ? "Язык" : "Language";
    if (location.pathname.startsWith("/menu/theme")) return isRu ? "Тема" : "Theme";
    if (location.pathname.startsWith("/menu/rules")) return isRu ? "Правила" : "Rules";
    if (location.pathname.startsWith("/menu/responsible")) return isRu ? "Ответственная игра" : "Responsible play";
    if (location.pathname.startsWith("/menu")) return isRu ? "Меню" : "Menu";
    if (location.pathname.startsWith("/tariffs")) return isRu ? "Тарифы" : "Tariffs";
    if (location.pathname.startsWith("/news")) return isRu ? "Новости" : "News";
    if (location.pathname.startsWith("/admin")) return isRu ? "Админка" : "Admin";
    return isRu ? "Главная" : "Home";
  }, [isRu, location.pathname]);

  const subtitle = isRu
    ? "Сигналы, статистика и доступ к сильным игровым ситуациям"
    : "Signals, statistics, and access to strong market situations";

  const tabs = [
    {
      to: "/",
      label: isRu ? "Главная" : "Home",
      icon: <HomeIcon />,
      active: location.pathname === "/",
    },
    {
      to: "/feed",
      label: isRu ? "Лента" : "Feed",
      icon: <FeedIcon />,
      active: location.pathname.startsWith("/feed"),
    },
    {
      to: "/stats",
      label: isRu ? "Статистика" : "Stats",
      icon: <StatsIcon />,
      active: location.pathname.startsWith("/stats"),
    },
    {
      to: "/profile",
      label: isRu ? "Профиль" : "Profile",
      icon: <ProfileIcon />,
      active: location.pathname.startsWith("/profile"),
    },
    {
      to: "/menu",
      label: isRu ? "Меню" : "Menu",
      icon: <MenuIcon />,
      active:
        location.pathname.startsWith("/menu") ||
        location.pathname.startsWith("/tariffs") ||
        location.pathname.startsWith("/news") ||
        (isAdmin && location.pathname.startsWith("/admin")),
    },
  ];

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <span className="brand-pill">PIT BET</span>
        <div className="title-row">
          <h1>{pageTitle}</h1>
          {isAdmin ? <span className="role-badge">Admin</span> : null}
        </div>
        <p>{subtitle}</p>
      </header>

      <main className="app-content app-scroll">{children}</main>

      <nav className="tabbar">
        {tabs.map((tab) => (
          <BottomNavItem key={tab.to} to={tab.to} icon={tab.icon} label={tab.label} active={tab.active} />
        ))}
      </nav>
    </div>
  );
}
