import { Bell, ChevronRight, ClipboardList, CreditCard, Globe2, Inbox, LifeBuoy, ListChecks, Newspaper, Palette, ShieldCheck, UserCog, WalletCards } from "lucide-react";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import { Link } from "react-router-dom";

import { useI18n } from "../app/i18n";
import { LEGAL_TEXTS } from "../app/legal";
import { resolveSubscriptionSnapshot } from "../app/subscription";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { RocketLoader } from "../components/ui";
import { api, type Me, type NotificationSettings, type ReferralStats, type SupportDialogStatus } from "../services/api";
import { waitForTelegramInitData } from "../services/telegram";

function formatDate(value: string | null, language: "ru" | "en", fallback: string): string {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

type ProfileRow = {
  key: string;
  to: string;
  label: string;
  subtitle: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  value?: string;
};

type ProfileSection = {
  key: string;
  title: string;
  rows: ProfileRow[];
};

export function ProfilePage() {
  const { t, language } = useI18n();
  const legalCopy = LEGAL_TEXTS[language === "en" ? "en" : "ru"];

  const [me, setMe] = useState<Me | null>(null);
  const [notify, setNotify] = useState<NotificationSettings | null>(null);
  const [referral, setReferral] = useState<ReferralStats | null>(null);
  const [subscriptionRaw, setSubscriptionRaw] = useState<{ tariff: string; status: string; ends_at: string | null } | null>(null);
  const [supportStatus, setSupportStatus] = useState<SupportDialogStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const initData = await waitForTelegramInitData();
      if (!alive || !initData) {
        setLoading(false);
        return;
      }

      const results = await Promise.allSettled([api.me(), api.myNotificationSettings(), api.myReferral(), api.mySubscription(), api.mySupportDialog()]);
      if (!alive) return;

      const [meRes, notifyRes, referralRes, subRes, supportRes] = results;
      setMe(meRes.status === "fulfilled" ? meRes.value : null);
      setNotify(notifyRes.status === "fulfilled" ? notifyRes.value : null);
      setReferral(referralRes.status === "fulfilled" ? referralRes.value : null);
      setSubscriptionRaw(subRes.status === "fulfilled" ? subRes.value : null);
      setSupportStatus(supportRes.status === "fulfilled" ? supportRes.value.dialog?.status ?? null : null);
      setLoading(false);
    };

    void load();
    return () => {
      alive = false;
    };
  }, []);

  const subscription = resolveSubscriptionSnapshot(subscriptionRaw);
  const isAdmin = Boolean(me?.role === "admin" || me?.is_admin);
  const isSupport = Boolean(me?.role === "support" || me?.is_support);
  const isStaff = isAdmin || isSupport;

  const accessValue = subscription.tariff === "vip" ? t("common.vip") : subscription.tariff === "premium" ? t("common.premium") : t("common.free");
  const supportValue =
    supportStatus && supportStatus !== "closed"
      ? t("menu.services.support.status.active")
      : supportStatus === "closed"
        ? t("menu.services.support.status.closed")
        : t("menu.services.support.status.available");
  const notificationsEnabledCount = notify
    ? [notify.notify_free, notify.notify_premium, notify.notify_vip, notify.notify_results, notify.notify_news].filter(Boolean).length
    : 0;
  const notificationsStatus = notify?.notifications_enabled ? t("common.status.active") : t("common.status.inactive");
  const themeLabel = (me?.theme || "dark") === "light" ? t("theme.light") : t("theme.dark");
  const languageLabel = (me?.language || language) === "en" ? t("language.en") : t("language.ru");

  const sections = useMemo<ProfileSection[]>(() => {
    const mainRows: ProfileRow[] = [
      {
        key: "tariffs",
        to: "/tariffs",
        label: t("hub.item.tariffs.title"),
        subtitle: t("menu.account.tariff.subtitle"),
        icon: WalletCards,
        value: accessValue,
      },
      {
        key: "signals",
        to: "/feed",
        label: t("hub.item.signals.title"),
        subtitle: t("hub.item.signals.desc"),
        icon: ListChecks,
      },
      {
        key: "news",
        to: "/news",
        label: t("hub.item.news.title"),
        subtitle: t("menu.services.news.subtitle"),
        icon: Newspaper,
      },
      {
        key: "support",
        to: "/support",
        label: legalCopy.moreLinks.supportTitle,
        subtitle: legalCopy.moreLinks.supportSubtitle,
        icon: LifeBuoy,
        value: supportValue,
      },
    ];

    const settingsRows: ProfileRow[] = [
      {
        key: "notifications",
        to: "/profile/notifications",
        label: t("hub.item.notifications.title"),
        subtitle: t("menu.account.notifications.subtitle"),
        icon: Bell,
        value: `${notificationsEnabledCount}/5`,
      },
      {
        key: "language",
        to: "/menu/language",
        label: t("hub.item.language.title"),
        subtitle: t("hub.item.language.desc"),
        icon: Globe2,
        value: languageLabel,
      },
      {
        key: "theme",
        to: "/menu/theme",
        label: t("hub.item.theme.title"),
        subtitle: t("hub.item.theme.desc"),
        icon: Palette,
        value: themeLabel,
      },
    ];

    const legalRows: ProfileRow[] = [
      {
        key: "rules",
        to: "/menu/rules",
        label: legalCopy.moreLinks.rulesTitle,
        subtitle: legalCopy.moreLinks.rulesSubtitle,
        icon: ClipboardList,
      },
      {
        key: "responsible",
        to: "/menu/responsible",
        label: legalCopy.moreLinks.responsibleTitle,
        subtitle: legalCopy.moreLinks.responsibleSubtitle,
        icon: ShieldCheck,
      },
      {
        key: "payment",
        to: "/menu/payment-refund",
        label: legalCopy.moreLinks.paymentTitle,
        subtitle: legalCopy.moreLinks.paymentSubtitle,
        icon: CreditCard,
      },
    ];

    const staffRows: ProfileRow[] = [];

    if (isAdmin) {
      staffRows.push({
        key: "admin",
        to: "/admin",
        label: t("hub.item.admin.title"),
        subtitle: t("menu.staff.adminDesc"),
        icon: UserCog,
      });
    }

    if (isStaff) {
      staffRows.push({
        key: "inbox",
        to: "/support/inbox",
        label: t("menu.support.inboxTitle"),
        subtitle: t("menu.staff.inboxDesc"),
        icon: Inbox,
      });
    }

    const grouped: ProfileSection[] = [
      {
        key: "main",
        title: language === "ru" ? "Основное" : "Main",
        rows: mainRows,
      },
      {
        key: "settings",
        title: language === "ru" ? "Настройки" : "Settings",
        rows: settingsRows,
      },
      {
        key: "legal",
        title: language === "ru" ? "Правила" : "Legal",
        rows: legalRows,
      },
    ];

    if (staffRows.length > 0) {
      grouped.push({
        key: "staff",
        title: language === "ru" ? "Команда" : "Team",
        rows: staffRows,
      });
    }

    return grouped;
  }, [accessValue, isAdmin, isStaff, language, languageLabel, legalCopy.moreLinks.paymentSubtitle, legalCopy.moreLinks.paymentTitle, legalCopy.moreLinks.responsibleSubtitle, legalCopy.moreLinks.responsibleTitle, legalCopy.moreLinks.rulesSubtitle, legalCopy.moreLinks.rulesTitle, legalCopy.moreLinks.supportSubtitle, legalCopy.moreLinks.supportTitle, notificationsEnabledCount, supportValue, t, themeLabel]);

  if (loading) {
    return (
      <Layout>
        <section className="pb-premium-panel pb-reveal">
          <RocketLoader title={t("profile.loadingTitle")} subtitle={t("profile.loadingSubtitle")} />
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="pb-premium-panel pb-telegram-profile-hero pb-reveal">
        <h3>{t("layout.title.profile")}</h3>
        <p>{language === "ru" ? "Управляйте доступом, настройками и сервисами PIT BET в одном экране." : "Manage access, settings and PIT BET services in one screen."}</p>

        <Link className="pb-telegram-profile-cta" to="/tariffs">
          {t("layout.main.openTariffs")}
        </Link>

        <div className="pb-telegram-profile-kpis" id="center">
          <article>
            <small>{t("menu.metric.access")}</small>
            <strong>{accessValue}</strong>
            <span>{formatDate(subscription.ends_at, language, t("common.noDate"))}</span>
          </article>
          <article>
            <small>{t("hub.item.referrals.title")}</small>
            <strong>{`${referral?.invited ?? 0} / ${referral?.activated ?? 0}`}</strong>
            <span>{`${referral?.bonus_days ?? 0} ${t("common.daysShort")}`}</span>
          </article>
          <article>
            <small>{t("hub.item.notifications.title")}</small>
            <strong>{notificationsStatus}</strong>
            <span>{`${notificationsEnabledCount}/5`}</span>
          </article>
        </div>
      </section>

      {sections.map((section) => (
        <section key={section.key} className="pb-premium-panel pb-telegram-profile-section pb-reveal">
          <div className="pb-telegram-profile-section-head">
            <h4>{section.title}</h4>
          </div>
          <div className="pb-telegram-profile-list">
            {section.rows.map((row) => {
              const Icon = row.icon;
              return (
                <Link key={row.key} to={row.to} className="pb-telegram-profile-row">
                  <span className="pb-telegram-profile-row-icon" aria-hidden="true">
                    <Icon size={20} strokeWidth={2} />
                  </span>
                  <span className="pb-telegram-profile-row-copy">
                    <strong>{row.label}</strong>
                    <small>{row.subtitle}</small>
                  </span>
                  <span className="pb-telegram-profile-row-value">
                    {row.value ? <em>{row.value}</em> : null}
                    <ChevronRight size={17} strokeWidth={2} />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}

      <AppDisclaimer />
    </Layout>
  );
}
