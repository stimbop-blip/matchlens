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
import { HubLauncher } from "./HubLauncher";

type PageMeta = {
  titleKey: string;
  subtitleKey: string;
};

type MainAction =
  | {
      labelKey: string;
      mode: "route";
      target: string;
    }
  | {
      labelKey: string;
      mode: "hub";
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
  if (pathname.startsWith("/menu")) return { titleKey: "layout.title.hub", subtitleKey: "layout.subtitle.hub" };
  if (pathname.startsWith("/admin")) return { titleKey: "layout.title.admin", subtitleKey: "layout.subtitle.admin" };
  return { titleKey: "layout.title.home", subtitleKey: "layout.subtitle.home" };
}

function mainAction(pathname: string): MainAction | null {
  if (pathname === "/") return { labelKey: "layout.main.openSignals", mode: "route", target: "/feed" };
  if (pathname.startsWith("/feed")) return { labelKey: "layout.main.openHub", mode: "hub" };
  if (pathname.startsWith("/stats")) return { labelKey: "layout.main.openSignals", mode: "route", target: "/feed" };
  if (pathname.startsWith("/profile")) return { labelKey: "layout.main.openTariffs", mode: "route", target: "/tariffs" };
  if (pathname.startsWith("/tariffs")) return { labelKey: "layout.main.openProfile", mode: "route", target: "/profile" };
  if (pathname.startsWith("/news")) return { labelKey: "layout.main.openSignals", mode: "route", target: "/feed" };
  if (pathname.startsWith("/menu") || pathname.startsWith("/admin")) return { labelKey: "layout.main.openHome", mode: "route", target: "/" };
  return null;
}

export function Layout({ children }: PropsWithChildren) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const [isAdmin, setIsAdmin] = useState(false);
  const [hubOpen, setHubOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    const loadRole = async () => {
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
    void loadRole();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    setHubOpen(false);
  }, [location.pathname]);

  const meta = useMemo(() => pageMeta(location.pathname), [location.pathname]);
  const action = useMemo(() => mainAction(location.pathname), [location.pathname]);

  useEffect(() => {
    const atHome = location.pathname === "/";
    const cleanupBack = configureTelegramBackButton(hubOpen || !atHome, () => {
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
      if (!action) return;
      if (action.mode === "hub") {
        setHubOpen(true);
        return;
      }
      navigate(action.target);
    });

    return () => {
      cleanupBack();
      cleanupSettings();
      cleanupMain();
    };
  }, [action, hubOpen, location.pathname, navigate, t]);

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

      <HubLauncher onOpen={() => setHubOpen(true)} hidden={hubOpen} />
      <CommandHub open={hubOpen} onClose={() => setHubOpen(false)} isAdmin={isAdmin} />
    </div>
  );
}
