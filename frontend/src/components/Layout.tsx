import { type PropsWithChildren, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useI18n } from "../app/i18n";
import { BottomNav } from "./layout/BottomNav";
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

      <BottomNav />
    </div>
  );
}
