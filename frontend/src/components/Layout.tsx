import { type PropsWithChildren, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useI18n } from "../app/i18n";
import { PremiumDock } from "./premium/PremiumDock";
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
  if (pathname.startsWith("/menu/payment-refund")) return { titleKey: "layout.title.paymentRefund", subtitleKey: "layout.subtitle.paymentRefund" };
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

function DockGlyph({ type }: { type: "overview" | "signals" | "stats" | "account" | "center" }) {
  if (type === "overview") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 5.3h16v5.1H4zm0 7h7.2v6.4H4zm8.8 0H20v2.8h-7.2zm0 3.8H20v2.6h-7.2z" />
      </svg>
    );
  }
  if (type === "signals") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 6.2h16v2H4zm0 4.1h10.8v2H4zm0 4.1h16v2H4z" />
        <path d="M17.1 10.3h2.8v2h-2.8z" />
      </svg>
    );
  }
  if (type === "stats") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 18.4h16v1.6H4zm2-2.2h2.6V9.4H6zm4.5 0h2.6V6.2h-2.6zm4.5 0h2.6v-4.6H15z" />
      </svg>
    );
  }
  if (type === "account") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 4.5a4.1 4.1 0 1 1 0 8.2 4.1 4.1 0 0 1 0-8.2m0 10.4c4.7 0 7.7 2.3 8.1 4.8H3.9c.4-2.5 3.4-4.8 8.1-4.8" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 3.5 1.4 2.3 2.6-.1.8 2.5 2.2 1.4-1 2.4 1 2.4-2.2 1.4-.8 2.5-2.6-.1L12 20.5l-1.4-2.3-2.6.1-.8-2.5-2.2-1.4 1-2.4-1-2.4 2.2-1.4.8-2.5 2.6.1z" />
      <circle cx="12" cy="12" r="2.3" />
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
  const dockItems = useMemo(
    () => [
      {
        key: "overview",
        label: t("layout.nav.home"),
        to: "/",
        active: location.pathname === "/",
        glyph: <DockGlyph type="overview" />,
      },
      {
        key: "signals",
        label: t("layout.nav.feed"),
        to: "/feed",
        active: location.pathname.startsWith("/feed"),
        glyph: <DockGlyph type="signals" />,
      },
      {
        key: "stats",
        label: t("layout.nav.stats"),
        to: "/stats",
        active: location.pathname.startsWith("/stats"),
        glyph: <DockGlyph type="stats" />,
      },
      {
        key: "account",
        label: t("layout.nav.profile"),
        to: "/profile",
        active: location.pathname.startsWith("/profile"),
        glyph: <DockGlyph type="account" />,
      },
      {
        key: "center",
        label: t("layout.nav.center"),
        to: "/menu",
        active: isMorePath(location.pathname),
        glyph: <DockGlyph type="center" />,
      },
    ],
    [location.pathname, t],
  );

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

      <PremiumDock items={dockItems} ariaLabel={t("layout.nav.aria")} />
    </div>
  );
}
