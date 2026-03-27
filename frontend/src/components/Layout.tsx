import { type PropsWithChildren, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useLanguage } from "../app/language";
import { api } from "../services/api";
import {
  configureTelegramBackButton,
  configureTelegramMainButton,
  configureTelegramSettingsButton,
  waitForTelegramInitData,
} from "../services/telegram";

function HubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 5h6v6H5zm8 0h6v6h-6zM5 13h6v6H5zm8 0h6v6h-6z" />
    </svg>
  );
}

export function Layout({ children }: PropsWithChildren) {
  const { language } = useLanguage();
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
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

  const subtitle = useMemo(() => {
    if (location.pathname.startsWith("/feed")) {
      return isRu ? "Прематч и live-сигналы с быстрой фильтрацией" : "Prematch and live signals with fast filtering";
    }
    if (location.pathname.startsWith("/stats")) {
      return isRu ? "Фактические результаты, ROI и структура сигналов" : "Actual results, ROI, and signal structure";
    }
    if (location.pathname.startsWith("/profile")) {
      return isRu ? "Доступ, оплата, бонусы и настройки аккаунта" : "Access, payments, bonuses, and account settings";
    }
    if (location.pathname.startsWith("/menu") || location.pathname.startsWith("/tariffs") || location.pathname.startsWith("/news")) {
      return isRu ? "Настройки, сервисные разделы и управление продуктом" : "Settings, service sections, and product control";
    }
    return isRu ? "Отобранные сигналы, доступ и ключевые события PIT BET" : "Selected signals, access, and key PIT BET updates";
  }, [isRu, location.pathname]);

  useEffect(() => {
    const isHome = location.pathname === "/";
    const cleanupBack = configureTelegramBackButton(!isHome, () => {
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate("/");
      }
    });

    const cleanupSettings = configureTelegramSettingsButton(true, () => navigate("/menu"));

    const mainLabel =
      location.pathname === "/"
        ? isRu
          ? "Открыть сигналы"
          : "Open signals"
        : location.pathname.startsWith("/feed")
          ? isRu
            ? "Открыть тарифы"
            : "Open tariffs"
          : "";
    const mainTarget = location.pathname === "/" ? "/feed" : location.pathname.startsWith("/feed") ? "/tariffs" : null;
    const cleanupMain = configureTelegramMainButton(Boolean(mainTarget), mainLabel, () => {
      if (mainTarget) navigate(mainTarget);
    });

    return () => {
      cleanupBack();
      cleanupSettings();
      cleanupMain();
    };
  }, [isRu, location.pathname, navigate]);

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <div className="topbar-row">
          <span className="brand-pill">PIT BET</span>
          <Link className="hub-launcher" to="/menu" aria-label={isRu ? "Открыть hub" : "Open hub"}>
            <HubIcon />
          </Link>
        </div>
        <div className="title-row">
          <h1>{pageTitle}</h1>
          {isAdmin ? <span className="role-badge">{isRu ? "Админ" : "Admin"}</span> : null}
        </div>
        <p>{subtitle}</p>
      </header>

      <main className="app-content app-scroll">{children}</main>
    </div>
  );
}
