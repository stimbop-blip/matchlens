import { type PropsWithChildren, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useI18n } from "../app/i18n";
import { api } from "../services/api";
import {
  configureTelegramBackButton,
  configureTelegramMainButton,
  configureTelegramSettingsButton,
  waitForTelegramInitData,
} from "../services/telegram";
import { CommandHub } from "./CommandHub";

function HubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 5h6v6H5zm8 0h6v6h-6zM5 13h6v6H5zm8 0h6v6h-6z" />
    </svg>
  );
}

function pageTitleKey(pathname: string): string {
  if (pathname.startsWith("/feed")) return "layout.title.feed";
  if (pathname.startsWith("/stats")) return "layout.title.stats";
  if (pathname.startsWith("/profile")) return "layout.title.profile";
  if (pathname.startsWith("/menu/language")) return "layout.title.language";
  if (pathname.startsWith("/menu/theme")) return "layout.title.theme";
  if (pathname.startsWith("/menu/rules")) return "layout.title.rules";
  if (pathname.startsWith("/menu/responsible")) return "layout.title.responsible";
  if (pathname.startsWith("/menu")) return "layout.title.menu";
  if (pathname.startsWith("/tariffs")) return "layout.title.tariffs";
  if (pathname.startsWith("/news")) return "layout.title.news";
  if (pathname.startsWith("/admin")) return "layout.title.admin";
  return "layout.title.home";
}

function pageSubtitleKey(pathname: string): string {
  if (pathname.startsWith("/feed")) return "layout.subtitle.feed";
  if (pathname.startsWith("/stats")) return "layout.subtitle.stats";
  if (pathname.startsWith("/profile")) return "layout.subtitle.profile";
  if (pathname.startsWith("/menu") || pathname.startsWith("/admin")) return "layout.subtitle.hub";
  if (pathname.startsWith("/news")) return "layout.subtitle.news";
  if (pathname.startsWith("/tariffs")) return "layout.subtitle.tariffs";
  if (pathname === "/") return "layout.subtitle.home";
  return "layout.subtitle.generic";
}

function mainAction(pathname: string): { labelKey: string; target: string } | null {
  if (pathname === "/") return { labelKey: "layout.main.home", target: "/feed" };
  if (pathname.startsWith("/feed")) return { labelKey: "layout.main.feed", target: "/tariffs" };
  if (pathname.startsWith("/stats")) return { labelKey: "layout.main.stats", target: "/feed" };
  if (pathname.startsWith("/profile")) return { labelKey: "layout.main.profile", target: "/tariffs" };
  if (pathname.startsWith("/news")) return { labelKey: "layout.main.news", target: "/feed" };
  if (pathname.startsWith("/tariffs")) return { labelKey: "layout.main.tariffs", target: "/profile" };
  return null;
}

export function Layout({ children }: PropsWithChildren) {
  const { t } = useI18n();
  const [isAdmin, setIsAdmin] = useState(false);
  const [hubOpen, setHubOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

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

  useEffect(() => {
    setHubOpen(false);
  }, [location.pathname]);

  const pageTitle = useMemo(() => t(pageTitleKey(location.pathname)), [location.pathname, t]);
  const subtitle = useMemo(() => t(pageSubtitleKey(location.pathname)), [location.pathname, t]);

  useEffect(() => {
    const isHome = location.pathname === "/";
    const action = mainAction(location.pathname);

    const cleanupBack = configureTelegramBackButton(hubOpen || !isHome, () => {
      if (hubOpen) {
        setHubOpen(false);
        return;
      }
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate("/");
      }
    });

    const cleanupSettings = configureTelegramSettingsButton(true, () => setHubOpen(true));

    const cleanupMain = configureTelegramMainButton(Boolean(action && !hubOpen), action ? t(action.labelKey) : "", () => {
      if (action) navigate(action.target);
    });

    return () => {
      cleanupBack();
      cleanupSettings();
      cleanupMain();
    };
  }, [hubOpen, location.pathname, navigate, t]);

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <div className="topbar-row">
          <span className="brand-pill">PIT BET</span>
          <button className="hub-launcher" type="button" aria-label={t("layout.hub.open")} onClick={() => setHubOpen(true)}>
            <HubIcon />
          </button>
        </div>
        <div className="title-row">
          <h1>{pageTitle}</h1>
          {isAdmin ? <span className="role-badge">{t("layout.role.admin")}</span> : null}
        </div>
        <p>{subtitle}</p>
      </header>

      <main className="app-content app-scroll">{children}</main>

      <CommandHub open={hubOpen} onClose={() => setHubOpen(false)} isAdmin={isAdmin} />
    </div>
  );
}
