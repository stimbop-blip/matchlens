import { type PropsWithChildren, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import { useI18n } from "../app/i18n";
import { useTheme } from "../app/language";
import { BottomNav } from "./layout/BottomNav";
import { GiftBox } from "./GiftBox";
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

let cachedStaffRole: "admin" | "support" | null | undefined;
let cachedStaffRoleAt = 0;
const STAFF_ROLE_CACHE_TTL_MS = 120000;

function pageMeta(pathname: string): PageMeta {
  if (pathname.startsWith("/feed/")) return { titleKey: "layout.title.signal", subtitleKey: "layout.subtitle.signal" };
  if (pathname.startsWith("/feed")) return { titleKey: "layout.title.feed", subtitleKey: "layout.subtitle.feed" };
  if (pathname.startsWith("/chat")) return { titleKey: "layout.title.chat", subtitleKey: "layout.subtitle.chat" };
  if (pathname.startsWith("/stats")) return { titleKey: "layout.title.stats", subtitleKey: "layout.subtitle.stats" };
  if (pathname.startsWith("/profile/notifications")) return { titleKey: "profile.notifications.title", subtitleKey: "profile.notifications.subtitle" };
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
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [staffRole, setStaffRole] = useState<"admin" | "support" | null>(null);

  useEffect(() => {
    let alive = true;
    const loadRole = async () => {
      if (Date.now() - cachedStaffRoleAt < STAFF_ROLE_CACHE_TTL_MS && cachedStaffRole !== undefined) {
        setStaffRole(cachedStaffRole);
        return;
      }

      try {
        const me = await api.me();
        if (!alive) return;
        if (me.role === "admin") {
          cachedStaffRole = "admin";
          setStaffRole("admin");
        } else if (me.role === "support") {
          cachedStaffRole = "support";
          setStaffRole("support");
        } else {
          cachedStaffRole = null;
          setStaffRole(null);
        }
        cachedStaffRoleAt = Date.now();
      } catch {
        if (!alive) return;
        cachedStaffRole = null;
        cachedStaffRoleAt = Date.now();
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

  const isHome = location.pathname === "/";
  const nextTheme = theme === "light" ? "dark" : "light";

  return (
    <div className="pb-app-shell">
      <div className="pb-backdrop-glow" aria-hidden="true" />

      {isHome ? (
        <header className="pb-app-header pb-app-header-home">
          <div className="pb-brand-row">
            <span className="pb-brand-chip">PIT BET</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {staffRole && location.pathname !== "/menu" ? (
                <span className="pb-role-chip">{staffRole === "admin" ? t("layout.role.admin") : t("layout.role.support")}</span>
              ) : null}
              <GiftBox />
              <button
                type="button"
                onClick={() => setTheme(nextTheme)}
                className="pb-theme-icon-btn"
                aria-label="Toggle theme"
                style={{ border: "none", cursor: "pointer", padding: 0, background: "transparent" }}
              >
                {theme === "light" ? (
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="4.2" fill="#f5a524" />
                    {[
                      [12, 2.5],
                      [12, 21.5],
                      [2.5, 12],
                      [21.5, 12],
                      [5.6, 5.6],
                      [18.4, 18.4],
                      [5.6, 18.4],
                      [18.4, 5.6],
                    ].map(([x, y], i) => (
                      <line key={i} x1={x} y1={y} x2={12 + (x - 12) * 0.55} y2={12 + (y - 12) * 0.55} stroke="#f5a524" strokeWidth="2" strokeLinecap="round" />
                    ))}
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" fill="#a78bfa" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <h1>{t(meta.titleKey)}</h1>
          <p>{t(meta.subtitleKey)}</p>
        </header>
      ) : (
        <div className="pb-app-header-spacer" aria-hidden="true" />
      )}

      <main key={location.pathname} className="pb-scene">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
