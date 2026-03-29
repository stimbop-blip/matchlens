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
  if (pathname.startsWith("/support/inbox")) return { titleKey: "layout.title.supportInbox", subtitleKey: "layout.subtitle.supportInbox" };
  if (pathname.startsWith("/support")) return { titleKey: "layout.title.support", subtitleKey: "layout.subtitle.support" };
  if (pathname.startsWith("/menu")) return { titleKey: "layout.title.hub", subtitleKey: "layout.subtitle.hub" };
  if (pathname.startsWith("/admin")) return { titleKey: "layout.title.admin", subtitleKey: "layout.subtitle.admin" };
  return { titleKey: "layout.title.home", subtitleKey: "layout.subtitle.home" };
}

function isMorePath(pathname: string): boolean {
  return pathname.startsWith("/menu") || pathname.startsWith("/news") || pathname.startsWith("/tariffs") || pathname.startsWith("/admin") || pathname.startsWith("/support");
}

function DockGlyph({ type }: { type: "home" | "feed" | "stats" | "profile" | "more" }) {
  if (type === "home") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 4 4 10.2V20h6.2v-5.2h3.6V20H20v-9.8z" />
      </svg>
    );
  }
  if (type === "feed") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 5.8h16v3H4zm0 5.6h16v3H4zm0 5.6h10.4v3H4z" />
      </svg>
    );
  }
  if (type === "stats") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 18.6h16v1.8H4zm1.8-2.4h2.8V8.9H5.8zm4.8 0h2.8V5.3h-2.8zm4.8 0h2.8v-6h-2.8z" />
      </svg>
    );
  }
  if (type === "profile") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 4.6a4.2 4.2 0 1 1 0 8.4 4.2 4.2 0 0 1 0-8.4m0 10.6c4.7 0 7.8 2.4 8.2 4.9H3.8c.4-2.5 3.5-4.9 8.2-4.9" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5.2 10.8a2 2 0 1 0 0-4 2 2 0 0 0 0 4m6.8 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4m6.8 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4" />
      <path d="M5.2 17.2a2 2 0 1 0 0-4 2 2 0 0 0 0 4m6.8 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4m6.8 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4" />
    </svg>
  );
}

export function Layout({ children }: PropsWithChildren) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const [staffRole, setStaffRole] = useState<"admin" | "support" | null>(null);

  useEffect(() => {
    let alive = true;
    const loadRole = async () => {
      try {
        const me = await api.me();
        if (!alive) return;
        if (me.role === "admin") {
          setStaffRole("admin");
        } else if (me.role === "support") {
          setStaffRole("support");
        } else {
          setStaffRole(null);
        }
      } catch {
        if (!alive) return;
        setStaffRole(null);
      }
    };
    void loadRole();
    return () => {
      alive = false;
    };
  }, []);

  const meta = useMemo(() => pageMeta(location.pathname), [location.pathname]);

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
    const cleanupMain = configureTelegramMainButton(false, "", () => undefined);

    return () => {
      cleanupBack();
      cleanupSettings();
      cleanupMain();
    };
  }, [location.pathname, navigate]);

  return (
    <div className="pb-app-shell">
      <div className="pb-backdrop-glow" aria-hidden="true" />

      <header className="pb-app-header">
        <div className="pb-brand-row">
          <span className="pb-brand-chip">PIT BET</span>
          {staffRole && location.pathname !== "/menu" ? (
            <span className="pb-role-chip">{staffRole === "admin" ? t("layout.role.admin") : t("layout.role.support")}</span>
          ) : null}
        </div>
        <h1>{t(meta.titleKey)}</h1>
        <p>{t(meta.subtitleKey)}</p>
      </header>

      <main key={location.pathname} className="pb-scene">
        {children}
      </main>

      <nav className="pb-bottom-nav pb-floating-dock" aria-label={t("layout.nav.aria")}>
        <Link className={location.pathname === "/" ? "active" : ""} to="/" aria-current={location.pathname === "/" ? "page" : undefined}>
          <span className="pb-dock-icon">
            <DockGlyph type="home" />
          </span>
          <span>{t("layout.nav.home")}</span>
        </Link>
        <Link className={location.pathname.startsWith("/feed") ? "active" : ""} to="/feed" aria-current={location.pathname.startsWith("/feed") ? "page" : undefined}>
          <span className="pb-dock-icon">
            <DockGlyph type="feed" />
          </span>
          <span>{t("layout.nav.feed")}</span>
        </Link>
        <Link className={location.pathname.startsWith("/stats") ? "active" : ""} to="/stats" aria-current={location.pathname.startsWith("/stats") ? "page" : undefined}>
          <span className="pb-dock-icon">
            <DockGlyph type="stats" />
          </span>
          <span>{t("layout.nav.stats")}</span>
        </Link>
        <Link className={location.pathname.startsWith("/profile") ? "active" : ""} to="/profile" aria-current={location.pathname.startsWith("/profile") ? "page" : undefined}>
          <span className="pb-dock-icon">
            <DockGlyph type="profile" />
          </span>
          <span>{t("layout.nav.profile")}</span>
        </Link>
        <Link className={isMorePath(location.pathname) ? "active" : ""} to="/menu" aria-current={isMorePath(location.pathname) ? "page" : undefined}>
          <span className="pb-dock-icon">
            <DockGlyph type="more" />
          </span>
          <span>{t("layout.nav.more")}</span>
        </Link>
      </nav>
    </div>
  );
}
