import { type PropsWithChildren, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useI18n } from "../app/i18n";
import { api } from "../services/api";
import {
  configureTelegramBackButton,
  configureTelegramMainButton,
  configureTelegramSettingsButton,
} from "../services/telegram";

type PageMeta = {
  titleKey: string;
  subtitleKey: string;
};

type MainAction =
  | {
      labelKey: string;
      target: string;
    }
  | null;

function pageMeta(pathname: string): PageMeta {
  if (pathname.startsWith("/feed/")) return { titleKey: "layout.title.signal", subtitleKey: "layout.subtitle.signal" };
  if (pathname.startsWith("/feed")) return { titleKey: "layout.title.feed", subtitleKey: "layout.subtitle.feed" };
  if (pathname.startsWith("/stats")) return { titleKey: "layout.title.stats", subtitleKey: "layout.subtitle.stats" };
  if (pathname.startsWith("/profile")) return { titleKey: "layout.title.profile", subtitleKey: "layout.subtitle.profile" };
  if (pathname.startsWith("/tariffs")) return { titleKey: "layout.title.tariffs", subtitleKey: "layout.subtitle.tariffs" };
  if (pathname.startsWith("/news/")) return { titleKey: "layout.title.article", subtitleKey: "layout.subtitle.news" };
  if (pathname.startsWith("/news")) return { titleKey: "layout.title.news", subtitleKey: "layout.subtitle.news" };
  if (pathname.startsWith("/menu/language")) return { titleKey: "layout.title.language", subtitleKey: "layout.subtitle.settings" };
  if (pathname.startsWith("/menu/theme")) return { titleKey: "layout.title.theme", subtitleKey: "layout.subtitle.settings" };
  if (pathname.startsWith("/menu/rules")) return { titleKey: "layout.title.rules", subtitleKey: "layout.subtitle.legal" };
  if (pathname.startsWith("/menu/responsible")) return { titleKey: "layout.title.responsible", subtitleKey: "layout.subtitle.legal" };
  if (pathname.startsWith("/menu")) return { titleKey: "layout.title.hub", subtitleKey: "layout.subtitle.hub" };
  if (pathname.startsWith("/admin")) return { titleKey: "layout.title.admin", subtitleKey: "layout.subtitle.admin" };
  return { titleKey: "layout.title.home", subtitleKey: "layout.subtitle.home" };
}

function mainAction(pathname: string): MainAction {
  if (pathname === "/") return { labelKey: "layout.main.openSignals", target: "/feed" };
  if (pathname.startsWith("/feed")) return { labelKey: "layout.main.openStats", target: "/stats" };
  if (pathname.startsWith("/stats")) return { labelKey: "layout.main.openProfile", target: "/profile" };
  if (pathname.startsWith("/profile")) return { labelKey: "layout.main.openMore", target: "/menu" };
  if (pathname.startsWith("/menu") || pathname.startsWith("/news") || pathname.startsWith("/tariffs") || pathname.startsWith("/admin")) {
    return { labelKey: "layout.main.openHome", target: "/" };
  }
  return null;
}

function isMorePath(pathname: string): boolean {
  return pathname.startsWith("/menu") || pathname.startsWith("/news") || pathname.startsWith("/tariffs") || pathname.startsWith("/admin");
}

export function Layout({ children }: PropsWithChildren) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let alive = true;
    const loadRole = async () => {
      try {
        const me = await api.me();
        if (!alive) return;
        setIsAdmin(Boolean(me.is_admin || me.role === "admin"));
      } catch {
        if (!alive) return;
        setIsAdmin(false);
      }
    };
    void loadRole();
    return () => {
      alive = false;
    };
  }, []);

  const meta = useMemo(() => pageMeta(location.pathname), [location.pathname]);
  const action = useMemo(() => mainAction(location.pathname), [location.pathname]);

  useEffect(() => {
    const atHome = location.pathname === "/";
    const cleanupBack = configureTelegramBackButton(!atHome, () => {
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate("/");
      }
    });

    const cleanupSettings = configureTelegramSettingsButton(true, () => navigate("/menu"));

    const cleanupMain = configureTelegramMainButton(Boolean(action), action ? t(action.labelKey) : "", () => {
      if (!action) return;
      navigate(action.target);
    });

    return () => {
      cleanupBack();
      cleanupSettings();
      cleanupMain();
    };
  }, [action, location.pathname, navigate, t]);

  return (
    <div className="pb-app-shell">
      <div className="pb-backdrop-glow" aria-hidden="true" />

      <header className="pb-app-header">
        <div className="pb-brand-row">
          <span className="pb-brand-chip">PIT BET</span>
          {isAdmin ? <span className="pb-role-chip">{t("layout.role.admin")}</span> : null}
        </div>
        <h1>{t(meta.titleKey)}</h1>
        <p>{t(meta.subtitleKey)}</p>
      </header>

      <main key={location.pathname} className="pb-scene">
        {children}
      </main>

      <nav className="pb-bottom-nav" aria-label={t("layout.nav.aria")}>
        <Link className={location.pathname === "/" ? "active" : ""} to="/">
          {t("layout.nav.home")}
        </Link>
        <Link className={location.pathname.startsWith("/feed") ? "active" : ""} to="/feed">
          {t("layout.nav.feed")}
        </Link>
        <Link className={location.pathname.startsWith("/stats") ? "active" : ""} to="/stats">
          {t("layout.nav.stats")}
        </Link>
        <Link className={location.pathname.startsWith("/profile") ? "active" : ""} to="/profile">
          {t("layout.nav.profile")}
        </Link>
        <Link className={isMorePath(location.pathname) ? "active" : ""} to="/menu">
          {t("layout.nav.more")}
        </Link>
      </nav>
    </div>
  );
}
