import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { LEGAL_TEXTS } from "../app/legal";
import { useI18n } from "../app/i18n";
import { resolveSubscriptionSnapshot } from "../app/subscription";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { HeroPanel } from "../components/premium/HeroPanel";
import { PremiumKpi } from "../components/premium/PremiumKpi";
import { api, type Me, type NewsPost, type NotificationSettings, type ReferralStats, type SupportDialogStatus } from "../services/api";

function formatDate(value: string | null, language: "ru" | "en", fallback: string): string {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", {
    day: "2-digit",
    month: "short",
  });
}

function dateMs(value: string | null): number {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function subscriptionStatusLabel(status: string, t: (key: string) => string): string {
  if (status === "active") return t("common.status.active");
  if (status === "expired") return t("common.status.expired");
  if (status === "canceled") return t("common.status.canceled");
  if (status === "inactive") return t("common.status.inactive");
  return t("common.status.unknown");
}

type CenterIconKind =
  | "tariffs"
  | "referrals"
  | "notifications"
  | "news"
  | "support"
  | "language"
  | "theme"
  | "rules"
  | "responsible"
  | "payment"
  | "admin"
  | "inbox";

function iconPath(kind: CenterIconKind): string {
  if (kind === "tariffs") return "M12 3.4 19.5 12 12 20.6 4.5 12 12 3.4Zm0 2.6L7.1 12l4.9 5.6 4.9-5.6L12 6Z";
  if (kind === "referrals") return "M8.1 11a3.1 3.1 0 1 1 0-6.2 3.1 3.1 0 0 1 0 6.2Zm7.8 0a3.1 3.1 0 1 1 0-6.2 3.1 3.1 0 0 1 0 6.2ZM3.5 18.4c.4-2.2 2.4-3.7 4.6-3.7s4.2 1.5 4.6 3.7H3.5Zm7.8 0c.4-2 2.2-3.3 4.6-3.3 2.2 0 4 1.3 4.6 3.3h-9.2Z";
  if (kind === "notifications") return "M12 4.1a4.7 4.7 0 0 0-4.7 4.7v2.3c0 .8-.3 1.5-.9 2.1l-1.2 1.2h13.6l-1.2-1.2a3 3 0 0 1-.9-2.1V8.8A4.7 4.7 0 0 0 12 4.1Zm-2 12.7h4a2 2 0 0 1-4 0Z";
  if (kind === "news") return "M4.2 5.2h15.6v13.6H4.2V5.2Zm2.2 2.2v2.3h11.2V7.4H6.4Zm0 4.1v5.1h4.1v-5.1H6.4Zm5.9 0v1.5h5.3v-1.5h-5.3Zm0 2.4v1.5h5.3v-1.5h-5.3Z";
  if (kind === "support") return "M12 4.1a8 8 0 0 0-8 8v1.2A2.7 2.7 0 0 0 6.7 16h.9v-4.5h-1A5.4 5.4 0 0 1 12 6.1a5.4 5.4 0 0 1 5.4 5.4h-1V16h-4.5v2.2h2.6A2.5 2.5 0 0 0 17 15.7a2.7 2.7 0 0 0 2.9-2.7v-.9a8 8 0 0 0-8-8Z";
  if (kind === "language") return "M12 3.6a8.4 8.4 0 1 0 0 16.8 8.4 8.4 0 0 0 0-16.8Zm5.9 7.5h-2.7a13.5 13.5 0 0 0-1-4 6.2 6.2 0 0 1 3.7 4Zm-5.9-5c.8 1 1.5 2.7 1.8 5H10c.3-2.3 1-4 2-5Zm-2 12.8a13.5 13.5 0 0 1-1.8-5h3.7a13.5 13.5 0 0 1-1.9 5Zm4.2-5h3.8a6.2 6.2 0 0 1-3.8 5 13.4 13.4 0 0 0 0-5Zm0-2.8a13.4 13.4 0 0 0 0-5 6.2 6.2 0 0 1 3.8 5h-3.8Zm-8-.1a6.2 6.2 0 0 1 3.7-4 13.5 13.5 0 0 0-1 4H6.2Zm0 2.8H9a13.5 13.5 0 0 0 1 5 6.2 6.2 0 0 1-3.8-5Z";
  if (kind === "theme") return "M14.6 4.2a8.1 8.1 0 1 0 5.2 12.6 7.1 7.1 0 1 1-5.2-12.6Z";
  if (kind === "rules") return "M12 3.5 5 6.2V12c0 4 3 6.8 7 8.5 4-1.7 7-4.5 7-8.5V6.2L12 3.5Zm-1.1 11.8-2.5-2.4 1.4-1.4 1.1 1 3.3-3.3 1.4 1.4-4.7 4.7Z";
  if (kind === "responsible") return "M12 4.3c2.2-1.8 5.4-1.6 7.4.4a5.2 5.2 0 0 1 0 7.4L12 19.5 4.6 12a5.2 5.2 0 0 1 0-7.4 5.2 5.2 0 0 1 7.4-.4Zm-4 8.2h2l1-2.2 1.3 3.1h1.6l1.1-2.3H16";
  if (kind === "payment") return "M4.9 6.2h14.2a1 1 0 0 1 1 1v9.6a1 1 0 0 1-1 1H4.9a1 1 0 0 1-1-1V7.2a1 1 0 0 1 1-1Zm.9 2.1v1.7h12.4V8.3H5.8Zm0 3.4v3.8h5.9v-3.8H5.8Zm7 0v1.2h4.4v-1.2h-4.4Z";
  if (kind === "admin") return "M5 7.1h14v2.2H5V7.1Zm2.5 3.8h9v2.2h-9v-2.2Zm-1.4 3.8h11.8v2.2H6.1v-2.2Z";
  return "M4.1 6.1h15.8v8.7H6.8l-2.7 2.7V6.1Zm4.4 3.3h7.1v1.8H8.5V9.4Z";
}

function CenterIcon({ kind }: { kind: CenterIconKind }) {
  return (
    <span className="pb-center-v4-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d={iconPath(kind)} />
      </svg>
    </span>
  );
}

export function MenuPage() {
  const { t, language } = useI18n();
  const legalCopy = LEGAL_TEXTS[language === "en" ? "en" : "ru"];

  const [me, setMe] = useState<Me | null>(null);
  const [notify, setNotify] = useState<NotificationSettings | null>(null);
  const [referral, setReferral] = useState<ReferralStats | null>(null);
  const [subscriptionRaw, setSubscriptionRaw] = useState<{ tariff: string; status: string; ends_at: string | null } | null>(null);
  const [news, setNews] = useState<NewsPost[]>([]);
  const [newsReady, setNewsReady] = useState(false);
  const [supportDialogStatus, setSupportDialogStatus] = useState<SupportDialogStatus | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const results = await Promise.allSettled([
        api.me(),
        api.myNotificationSettings(),
        api.myReferral(),
        api.mySubscription(),
        api.news(),
        api.mySupportDialog(),
      ]);
      if (!alive) return;

      const [meRes, notifyRes, refRes, subRes, newsRes, supportRes] = results;
      setMe(meRes.status === "fulfilled" ? meRes.value : null);
      setNotify(notifyRes.status === "fulfilled" ? notifyRes.value : null);
      setReferral(refRes.status === "fulfilled" ? refRes.value : null);
      setSubscriptionRaw(subRes.status === "fulfilled" ? subRes.value : null);

      setNews(newsRes.status === "fulfilled" ? newsRes.value : []);
      setNewsReady(true);
      setSupportDialogStatus(supportRes.status === "fulfilled" ? supportRes.value.dialog?.status ?? null : null);
    };
    void load();
    return () => {
      alive = false;
    };
  }, []);

  const isAdmin = Boolean(me?.role === "admin" || me?.is_admin);
  const isSupport = Boolean(me?.role === "support" || me?.is_support);
  const isStaff = isAdmin || isSupport;

  const subscription = resolveSubscriptionSnapshot(subscriptionRaw);
  const accessValue = subscription.tariff === "vip" ? t("common.vip") : subscription.tariff === "premium" ? t("common.premium") : t("common.free");
  const accessUntil = formatDate(subscription.ends_at, language, t("common.noDate"));
  const statusValue = subscriptionStatusLabel(subscription.status, t);
  const notificationsStatus = notify?.notifications_enabled ? t("common.status.active") : t("common.status.inactive");

  const languageValue = (me?.language || language) === "en" ? t("language.en") : t("language.ru");
  const themeValue = (me?.theme || "dark") === "light" ? t("theme.light") : t("theme.dark");
  const categoryEnabledCount = [notify?.notify_free, notify?.notify_premium, notify?.notify_vip, notify?.notify_results, notify?.notify_news].filter(Boolean).length;

  const publishedNews = useMemo(() => news.filter((item) => item.is_published), [news]);
  const latestNews = useMemo(() => [...publishedNews].sort((a, b) => dateMs(b.published_at) - dateMs(a.published_at)).slice(0, 3), [publishedNews]);

  const supportStatusText = (() => {
    if (supportDialogStatus && supportDialogStatus !== "closed") return t("menu.services.support.status.active");
    if (supportDialogStatus === "closed") return t("menu.services.support.status.closed");
    return t("menu.services.support.status.available");
  })();

  return (
    <Layout>
      <HeroPanel
        eyebrow={t("menu.hero.eyebrow")}
        title={t("menu.hero.title")}
        subtitle={t("menu.hero.subtitle")}
        right={<span className={`pb-tier-pill ${subscription.tariff}`}>{accessValue}</span>}
      >
        <div className="pb-feed-v4-kpi">
          <PremiumKpi label={t("menu.hero.metric.notifications")} value={notificationsStatus} tone={notify?.notifications_enabled ? "success" : "warning"} />
          <PremiumKpi label={t("menu.hero.metric.access")} value={accessValue} tone="accent" />
          <PremiumKpi
            label={isStaff ? t("menu.hero.metric.staff") : t("menu.hero.metric.bonus")}
            value={isStaff ? (isAdmin ? t("layout.role.admin") : t("layout.role.support")) : `${referral?.bonus_days ?? 0} ${t("common.daysShort")}`}
            tone={isStaff ? "accent" : "success"}
          />
        </div>
      </HeroPanel>

      <section className="pb-premium-panel pb-center-v4-section pb-reveal">
        <div className="pb-premium-head">
          <h3>{t("menu.section.account")}</h3>
          <small>{t("menu.section.account.subtitle")}</small>
        </div>

        <div className="pb-center-v4-grid two">
          <Link className="pb-center-v4-card wide" to="/tariffs">
            <div className="pb-center-v4-head">
              <CenterIcon kind="tariffs" />
              <span className="pb-center-v4-chip">{statusValue}</span>
            </div>
            <h4>{t("hub.item.tariffs.title")}</h4>
            <p>{t("menu.account.tariff.subtitle")}</p>
            <div className="pb-center-v4-metrics">
              <span>{t("menu.metric.access")}: {accessValue}</span>
              <span>{t("menu.account.tariff.until")}: {accessUntil}</span>
            </div>
          </Link>

          <Link className="pb-center-v4-card" to="/profile#referral">
            <div className="pb-center-v4-head">
              <CenterIcon kind="referrals" />
            </div>
            <h4>{t("hub.item.referrals.title")}</h4>
            <p>{t("menu.account.referrals.subtitle")}</p>
            <div className="pb-center-v4-metrics">
              <span>{t("profile.referral.invited")}: {referral?.invited ?? 0}</span>
              <span>{t("profile.referral.activated")}: {referral?.activated ?? 0}</span>
            </div>
          </Link>

          <Link className="pb-center-v4-card" to="/profile/notifications">
            <div className="pb-center-v4-head">
              <CenterIcon kind="notifications" />
            </div>
            <h4>{t("hub.item.notifications.title")}</h4>
            <p>{t("menu.account.notifications.subtitle")}</p>
            <div className="pb-center-v4-metrics">
              <span>{notificationsStatus}</span>
              <span>{t("menu.account.notifications.categories", { enabled: categoryEnabledCount, total: 5 })}</span>
            </div>
          </Link>
        </div>
      </section>

      <section className="pb-premium-panel pb-center-v4-section pb-reveal">
        <div className="pb-premium-head">
          <h3>{t("menu.section.service")}</h3>
          <small>{t("menu.section.service.subtitle")}</small>
        </div>

        <div className="pb-center-v4-grid two">
          <Link className="pb-center-v4-card wide" to="/news">
            <div className="pb-center-v4-head">
              <CenterIcon kind="news" />
            </div>
            <h4>{t("hub.item.news.title")}</h4>
            <p>{t("menu.services.news.subtitle")}</p>
            <div className="pb-center-v4-news-list">
              {latestNews.length > 0
                ? latestNews.map((item) => (
                    <span key={item.id}>
                      {item.title}
                      <small>{formatDate(item.published_at, language, t("common.noDate"))}</small>
                    </span>
                  ))
                : [<span key="empty">{newsReady ? t("menu.services.news.empty") : t("common.loading")}</span>]}
            </div>
          </Link>

          <Link className="pb-center-v4-card" to="/support">
            <div className="pb-center-v4-head">
              <CenterIcon kind="support" />
              <span className="pb-center-v4-chip">{supportStatusText}</span>
            </div>
            <h4>{legalCopy.moreLinks.supportTitle}</h4>
            <p>{legalCopy.moreLinks.supportSubtitle}</p>
          </Link>

          <Link className="pb-center-v4-card" to="/menu/language">
            <div className="pb-center-v4-head">
              <CenterIcon kind="language" />
            </div>
            <h4>{t("hub.item.language.title")}</h4>
            <p>{t("hub.item.language.desc")}</p>
            <div className="pb-center-v4-metrics">
              <span>{languageValue}</span>
            </div>
          </Link>

          <Link className="pb-center-v4-card" to="/menu/theme">
            <div className="pb-center-v4-head">
              <CenterIcon kind="theme" />
            </div>
            <h4>{t("hub.item.theme.title")}</h4>
            <p>{t("hub.item.theme.desc")}</p>
            <div className="pb-center-v4-metrics">
              <span>{themeValue}</span>
            </div>
          </Link>
        </div>
      </section>

      <section className="pb-premium-panel pb-center-v4-section pb-reveal">
        <div className="pb-premium-head">
          <h3>{t("menu.section.info")}</h3>
          <small>{t("menu.section.info.subtitle")}</small>
        </div>

        <div className="pb-center-v4-grid three">
          <Link className="pb-center-v4-card" to="/menu/rules">
            <div className="pb-center-v4-head">
              <CenterIcon kind="rules" />
            </div>
            <h4>{legalCopy.moreLinks.rulesTitle}</h4>
            <p>{legalCopy.moreLinks.rulesSubtitle}</p>
          </Link>
          <Link className="pb-center-v4-card" to="/menu/responsible">
            <div className="pb-center-v4-head">
              <CenterIcon kind="responsible" />
            </div>
            <h4>{legalCopy.moreLinks.responsibleTitle}</h4>
            <p>{legalCopy.moreLinks.responsibleSubtitle}</p>
          </Link>
          <Link className="pb-center-v4-card" to="/menu/payment-refund">
            <div className="pb-center-v4-head">
              <CenterIcon kind="payment" />
            </div>
            <h4>{legalCopy.moreLinks.paymentTitle}</h4>
            <p>{legalCopy.moreLinks.paymentSubtitle}</p>
          </Link>
        </div>
      </section>

      {isStaff ? (
        <section className="pb-premium-panel pb-center-v4-section pb-reveal">
          <div className="pb-premium-head">
            <h3>{t("menu.section.staff")}</h3>
            <small>{t("menu.section.staff.subtitle")}</small>
          </div>

          <div className="pb-center-v4-grid two">
            {isAdmin ? (
              <Link className="pb-center-v4-card" to="/admin">
                <div className="pb-center-v4-head">
                  <CenterIcon kind="admin" />
                </div>
                <h4>{t("hub.item.admin.title")}</h4>
                <p>{t("menu.staff.adminDesc")}</p>
              </Link>
            ) : null}
            <Link className="pb-center-v4-card" to="/support/inbox">
              <div className="pb-center-v4-head">
                <CenterIcon kind="inbox" />
              </div>
              <h4>{t("menu.support.inboxTitle")}</h4>
              <p>{t("menu.staff.inboxDesc")}</p>
            </Link>
          </div>
        </section>
      ) : null}

      <AppDisclaimer />
    </Layout>
  );
}
