import { useEffect } from "react";
import { Link } from "react-router-dom";

import { useI18n } from "../app/i18n";

type CommandHubProps = {
  open: boolean;
  isAdmin: boolean;
  onClose: () => void;
};

type HubEntry = {
  to: string;
  icon: string;
  titleKey: string;
  subtitleKey?: string;
  adminOnly?: boolean;
};

const QUICK_ENTRIES: HubEntry[] = [
  { to: "/", icon: "🏠", titleKey: "hub.quick.overview" },
  { to: "/feed", icon: "🎯", titleKey: "hub.quick.signals" },
  { to: "/stats", icon: "📈", titleKey: "hub.quick.performance" },
  { to: "/profile", icon: "👤", titleKey: "hub.quick.account" },
];

const SERVICE_ENTRIES: HubEntry[] = [
  { to: "/tariffs", icon: "💎", titleKey: "hub.services.tariffs", subtitleKey: "hub.tag.membership" },
  { to: "/news", icon: "📰", titleKey: "hub.services.news", subtitleKey: "hub.tag.updates" },
  { to: "/profile#referral", icon: "👥", titleKey: "hub.services.referrals", subtitleKey: "hub.tag.bonus" },
  { to: "/profile#notifications", icon: "🔔", titleKey: "hub.services.notifications", subtitleKey: "hub.tag.alerts" },
  { to: "/menu/language", icon: "🌐", titleKey: "hub.services.settings", subtitleKey: "hub.tag.language" },
  { to: "/menu", icon: "🛟", titleKey: "hub.services.support", subtitleKey: "hub.tag.help" },
  { to: "/menu/rules", icon: "📘", titleKey: "hub.services.rules", subtitleKey: "hub.tag.policy" },
  { to: "/menu/responsible", icon: "⚖️", titleKey: "hub.services.responsible", subtitleKey: "hub.tag.responsible" },
  { to: "/admin", icon: "🛠", titleKey: "hub.admin.open", subtitleKey: "hub.tag.admin", adminOnly: true },
];

export function CommandHub({ open, isAdmin, onClose }: CommandHubProps) {
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className={open ? "hub-overlay open" : "hub-overlay"} aria-hidden={!open}>
      <button type="button" className="hub-backdrop" onClick={onClose} aria-label={t("hub.close")} />
      <section className="hub-panel" role="dialog" aria-modal="true" aria-label={t("hub.title")}>
        <div className="hub-head">
          <div>
            <span className="hero-eyebrow">{t("hub.eyebrow")}</span>
            <h2>{t("hub.title")}</h2>
            <p>{t("hub.subtitle")}</p>
          </div>
          <button type="button" className="hub-close" onClick={onClose}>
            {t("hub.close")}
          </button>
        </div>

        <div className="hub-grid">
          {QUICK_ENTRIES.map((entry) => (
            <Link key={entry.to} to={entry.to} className="hub-card" onClick={onClose}>
              <span className="hub-card-icon">{entry.icon}</span>
              <strong>{t(entry.titleKey)}</strong>
            </Link>
          ))}
        </div>

        <div className="hub-service-list">
          <h3>{t("hub.services.title")}</h3>
          {SERVICE_ENTRIES.filter((item) => !item.adminOnly || isAdmin).map((entry) => (
            <Link key={entry.to} to={entry.to} className="hub-service-row" onClick={onClose}>
              <span>{entry.icon}</span>
              <strong>{t(entry.titleKey)}</strong>
              <small>{entry.subtitleKey ? t(entry.subtitleKey) : ""}</small>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
