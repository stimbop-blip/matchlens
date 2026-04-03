import { useEffect } from "react";
import { Link } from "react-router-dom";

import { useI18n } from "../app/i18n";

type CommandHubProps = {
  open: boolean;
  isAdmin: boolean;
  onClose: () => void;
};

type HubEntry = {
  id: string;
  to?: string;
  href?: string;
  titleKey: string;
  descKey: string;
  section: "core" | "service" | "settings" | "legal";
  adminOnly?: boolean;
  disabled?: boolean;
};

export function CommandHub({ open, isAdmin, onClose }: CommandHubProps) {
  const { t } = useI18n();

  const entries: HubEntry[] = [
    { id: "signals", to: "/feed", titleKey: "hub.item.signals.title", descKey: "hub.item.signals.desc", section: "core" },
    { id: "stats", to: "/stats", titleKey: "hub.item.stats.title", descKey: "hub.item.stats.desc", section: "core" },
    { id: "profile", to: "/profile", titleKey: "hub.item.profile.title", descKey: "hub.item.profile.desc", section: "core" },
    { id: "tariffs", to: "/tariffs", titleKey: "hub.item.tariffs.title", descKey: "hub.item.tariffs.desc", section: "core" },
    { id: "news", to: "/news", titleKey: "hub.item.news.title", descKey: "hub.item.news.desc", section: "service" },
    { id: "referrals", to: "/profile#referral", titleKey: "hub.item.referrals.title", descKey: "hub.item.referrals.desc", section: "service" },
    { id: "notifications", to: "/profile/notifications", titleKey: "hub.item.notifications.title", descKey: "hub.item.notifications.desc", section: "service" },
    { id: "support", to: "/support", titleKey: "hub.item.support.title", descKey: "hub.item.support.desc", section: "service" },
    { id: "support-inbox", to: "/support/inbox", titleKey: "menu.support.inboxTitle", descKey: "menu.support.inboxDesc", section: "service", adminOnly: true },
    { id: "language", to: "/menu/language", titleKey: "hub.item.language.title", descKey: "hub.item.language.desc", section: "settings" },
    { id: "theme", to: "/menu/theme", titleKey: "hub.item.theme.title", descKey: "hub.item.theme.desc", section: "settings" },
    { id: "rules", to: "/menu/rules", titleKey: "hub.item.rules.title", descKey: "hub.item.rules.desc", section: "legal" },
    {
      id: "responsible",
      to: "/menu/responsible",
      titleKey: "hub.item.responsible.title",
      descKey: "hub.item.responsible.desc",
      section: "legal",
    },
    { id: "admin", to: "/admin", titleKey: "hub.item.admin.title", descKey: "hub.item.admin.desc", section: "service", adminOnly: true },
  ];

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const renderEntry = (entry: HubEntry) => {
    const body = (
      <>
        <strong>{t(entry.titleKey)}</strong>
        <p>{t(entry.descKey)}</p>
      </>
    );

    if (entry.disabled) {
      return (
        <div key={entry.id} className="pb-hub-card disabled">
          {body}
        </div>
      );
    }

    if (entry.href) {
      return (
        <a key={entry.id} href={entry.href} target="_blank" rel="noreferrer" className="pb-hub-card" onClick={onClose}>
          {body}
        </a>
      );
    }

    return (
      <Link key={entry.id} to={entry.to || "/"} className="pb-hub-card" onClick={onClose}>
        {body}
      </Link>
    );
  };

  const filtered = entries.filter((entry) => !entry.adminOnly || isAdmin);

  return (
    <div className={open ? "pb-hub-overlay open" : "pb-hub-overlay"} aria-hidden={!open}>
      <button className="pb-hub-backdrop" type="button" onClick={onClose} aria-label={t("hub.close")} />
      <section className="pb-hub-sheet" role="dialog" aria-modal="true" aria-label={t("hub.title")}
      >
        <header className="pb-hub-head">
          <div>
            <span className="pb-eyebrow">{t("hub.eyebrow")}</span>
            <h2>{t("hub.title")}</h2>
            <p>{t("hub.subtitle")}</p>
          </div>
          <button className="pb-btn pb-btn-ghost" type="button" onClick={onClose}>
            {t("hub.close")}
          </button>
        </header>

        <div className="pb-hub-section">
          <h3>{t("hub.section.core")}</h3>
          <div className="pb-hub-grid">{filtered.filter((entry) => entry.section === "core").map(renderEntry)}</div>
        </div>

        <div className="pb-hub-section">
          <h3>{t("hub.section.service")}</h3>
          <div className="pb-hub-grid">{filtered.filter((entry) => entry.section === "service").map(renderEntry)}</div>
        </div>

        <div className="pb-hub-section split">
          <div>
            <h3>{t("hub.section.settings")}</h3>
            <div className="pb-hub-grid compact">{filtered.filter((entry) => entry.section === "settings").map(renderEntry)}</div>
          </div>
          <div>
            <h3>{t("hub.section.legal")}</h3>
            <div className="pb-hub-grid compact">{filtered.filter((entry) => entry.section === "legal").map(renderEntry)}</div>
          </div>
        </div>
      </section>
    </div>
  );
}
